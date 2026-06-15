import {
  curriculumAssignments,
  curriculumModules,
  curriculumStageStudents,
  curriculumStages,
  hubEmployees,
  incubationHubs,
  studentProjects,
  students,
  type DatabaseClient,
} from "@scp/database";
import type {
  CurriculumAssignment,
  CurriculumDetail,
  CurriculumStage,
  CurriculumStageLearner,
} from "@scp/contracts";
import { and, asc, eq, sql } from "drizzle-orm";
import type {
  CurriculumAssignmentUpdateInput,
  CurriculumLearnerUpdateInput,
  CurriculumStageUpdateInput,
} from "./curriculum.schemas.js";

type CurriculumScope = {
  canSeeAll: boolean;
  hubId: string | null;
  institutionId?: string | null;
  studentId?: string | null;
};

type AssignmentRow = {
  completedSessions: number;
  domain: string;
  gradeBand: string;
  hubId: string;
  hubName: string;
  id: string;
  moduleCode: string;
  moduleId: string;
  moduleTitle: string;
  nextTopic: string;
  ownerEmployeeId: string | null;
  ownerEmployeeName: string | null;
  plannedSessions: number;
  status: CurriculumAssignment["status"];
};

function completionPercent(completed: number, planned: number) {
  return planned > 0 ? Math.min(100, Math.round((completed / planned) * 100)) : 0;
}

function scopedAssignmentWhere(scope: CurriculumScope, id?: string) {
  const scopeWhere = scope.canSeeAll
    ? undefined
    : scope.hubId
      ? eq(curriculumAssignments.hubId, scope.hubId)
      : sql`false`;
  return id ? and(eq(curriculumAssignments.id, id), scopeWhere) : scopeWhere;
}

function scopedLearnerWhere(scope: CurriculumScope) {
  if (scope.canSeeAll) {
    return undefined;
  }

  if (scope.studentId) {
    return eq(students.id, scope.studentId);
  }

  if (scope.institutionId) {
    return eq(students.institutionId, scope.institutionId);
  }

  return scope.hubId ? eq(students.hubId, scope.hubId) : sql`false`;
}

export function createCurriculumRepository(db: DatabaseClient) {
  function assignmentSelect() {
    return db
      .select({
        completedSessions: curriculumAssignments.completedSessions,
        domain: curriculumModules.domain,
        gradeBand: curriculumModules.gradeBand,
        hubId: curriculumAssignments.hubId,
        hubName: incubationHubs.name,
        id: curriculumAssignments.id,
        moduleCode: curriculumModules.code,
        moduleId: curriculumModules.id,
        moduleTitle: curriculumModules.title,
        nextTopic: curriculumAssignments.nextTopic,
        ownerEmployeeId: curriculumAssignments.ownerEmployeeId,
        ownerEmployeeName: hubEmployees.name,
        plannedSessions: curriculumAssignments.plannedSessions,
        status: curriculumAssignments.status,
      })
      .from(curriculumAssignments)
      .innerJoin(curriculumModules, eq(curriculumAssignments.moduleId, curriculumModules.id))
      .innerJoin(incubationHubs, eq(curriculumAssignments.hubId, incubationHubs.id))
      .leftJoin(hubEmployees, eq(curriculumAssignments.ownerEmployeeId, hubEmployees.id));
  }

  async function metricsForAssignment(assignmentId: string, scope: CurriculumScope) {
    const [stageRows, learnerRows] = await Promise.all([
      db
        .select({ id: curriculumStages.id })
        .from(curriculumStages)
        .where(eq(curriculumStages.assignmentId, assignmentId))
        .limit(100),
      db
        .select({
          projectId: curriculumStageStudents.projectId,
          studentId: curriculumStageStudents.studentId,
        })
        .from(curriculumStageStudents)
        .innerJoin(curriculumStages, eq(curriculumStageStudents.stageId, curriculumStages.id))
        .innerJoin(students, eq(curriculumStageStudents.studentId, students.id))
        .where(and(eq(curriculumStages.assignmentId, assignmentId), scopedLearnerWhere(scope)))
        .limit(5000),
    ]);

    return {
      projectCount: new Set(learnerRows.map((row) => row.projectId).filter(Boolean)).size,
      stageCount: stageRows.length,
      studentCount: new Set(learnerRows.map((row) => row.studentId)).size,
    };
  }

  async function toAssignment(row: AssignmentRow, scope: CurriculumScope): Promise<CurriculumAssignment> {
    const metrics = await metricsForAssignment(row.id, scope);

    return {
      ...row,
      completionPercent: completionPercent(row.completedSessions, row.plannedSessions),
      projectCount: metrics.projectCount,
      stageCount: metrics.stageCount,
      studentCount: metrics.studentCount,
    };
  }

  async function assignmentIdForStage(stageId: string, scope: CurriculumScope) {
    const [row] = await db
      .select({ assignmentId: curriculumStages.assignmentId })
      .from(curriculumStages)
      .innerJoin(curriculumAssignments, eq(curriculumStages.assignmentId, curriculumAssignments.id))
      .where(and(eq(curriculumStages.id, stageId), scopedAssignmentWhere(scope)))
      .limit(1);

    return row?.assignmentId ?? null;
  }

  async function assignmentIdForLearner(learnerId: string, scope: CurriculumScope) {
    const [row] = await db
      .select({ assignmentId: curriculumStages.assignmentId })
      .from(curriculumStageStudents)
      .innerJoin(curriculumStages, eq(curriculumStageStudents.stageId, curriculumStages.id))
      .innerJoin(curriculumAssignments, eq(curriculumStages.assignmentId, curriculumAssignments.id))
      .where(and(eq(curriculumStageStudents.id, learnerId), scopedAssignmentWhere(scope)))
      .limit(1);

    return row?.assignmentId ?? null;
  }

  async function recalculateAssignment(assignmentId: string) {
    const stages = await db
      .select({
        completedSessions: curriculumStages.completedSessions,
        nextTopic: curriculumStages.nextTopic,
        plannedSessions: curriculumStages.plannedSessions,
        sequence: curriculumStages.sequence,
        status: curriculumStages.status,
      })
      .from(curriculumStages)
      .where(eq(curriculumStages.assignmentId, assignmentId))
      .orderBy(asc(curriculumStages.sequence));

    if (stages.length === 0) {
      return;
    }

    const plannedSessions = stages.reduce((total, stage) => total + stage.plannedSessions, 0);
    const completedSessions = stages.reduce((total, stage) => total + stage.completedSessions, 0);
    const status = stages.every((stage) => stage.status === "completed")
      ? "completed"
      : stages.some((stage) => stage.status === "at_risk")
        ? "at_risk"
        : stages.some((stage) => stage.status === "active")
          ? "active"
          : "planned";
    const nextTopic =
      stages.find((stage) => stage.status === "active" && stage.nextTopic)?.nextTopic ??
      stages.find((stage) => stage.status !== "completed" && stage.nextTopic)?.nextTopic ??
      stages[stages.length - 1]?.nextTopic ??
      "Session planning pending";

    await db
      .update(curriculumAssignments)
      .set({
        completedSessions,
        nextTopic,
        plannedSessions,
        status,
        updatedAt: new Date(),
      })
      .where(eq(curriculumAssignments.id, assignmentId));
  }

  return {
    async getById(id: string, scope: CurriculumScope): Promise<CurriculumDetail | null> {
      const [row] = await assignmentSelect()
        .where(scopedAssignmentWhere(scope, id))
        .limit(1);

      if (!row) {
        return null;
      }

      const assignment = await toAssignment(row, scope);
      const stageRows = await db
        .select({
          attachmentUrl: curriculumStages.attachmentUrl,
          completedSessions: curriculumStages.completedSessions,
          detail: curriculumStages.detail,
          id: curriculumStages.id,
          nextTopic: curriculumStages.nextTopic,
          plannedSessions: curriculumStages.plannedSessions,
          sequence: curriculumStages.sequence,
          status: curriculumStages.status,
          title: curriculumStages.title,
        })
        .from(curriculumStages)
        .where(eq(curriculumStages.assignmentId, id))
        .orderBy(asc(curriculumStages.sequence));

      const stages: CurriculumStage[] = [];
      for (const stage of stageRows) {
        const learnerRows = await db
          .select({
            evidenceNote: curriculumStageStudents.evidenceNote,
            id: curriculumStageStudents.id,
            projectId: curriculumStageStudents.projectId,
            projectTitle: studentProjects.title,
            status: curriculumStageStudents.status,
            studentGrade: students.grade,
            studentId: students.id,
            studentName: students.name,
          })
          .from(curriculumStageStudents)
          .innerJoin(students, eq(curriculumStageStudents.studentId, students.id))
          .leftJoin(studentProjects, eq(curriculumStageStudents.projectId, studentProjects.id))
          .where(and(eq(curriculumStageStudents.stageId, stage.id), scopedLearnerWhere(scope)))
          .orderBy(asc(students.name));

        const learners: CurriculumStageLearner[] = learnerRows.map((learner) => ({ ...learner }));
        stages.push({
          ...stage,
          completionPercent: completionPercent(stage.completedSessions, stage.plannedSessions),
          learners,
          projectCount: new Set(learners.map((learner) => learner.projectId).filter(Boolean)).size,
          studentCount: learners.length,
        });
      }

      return {
        ...assignment,
        stages,
      };
    },

    async list(scope: CurriculumScope): Promise<CurriculumAssignment[]> {
      const rows = await assignmentSelect()
        .where(scopedAssignmentWhere(scope))
        .orderBy(asc(incubationHubs.name), asc(curriculumModules.code))
        .limit(500);

      return Promise.all(rows.map((row) => toAssignment(row, scope)));
    },

    async updateAssignment(
      id: string,
      input: CurriculumAssignmentUpdateInput,
      scope: CurriculumScope,
    ): Promise<CurriculumDetail | null> {
      const existing = await this.getById(id, scope);
      if (!existing) {
        return null;
      }

      await db
        .update(curriculumAssignments)
        .set({
          ...(input.completedSessions !== undefined ? { completedSessions: input.completedSessions } : {}),
          ...(input.nextTopic !== undefined ? { nextTopic: input.nextTopic } : {}),
          ...(input.ownerEmployeeId !== undefined ? { ownerEmployeeId: input.ownerEmployeeId } : {}),
          ...(input.plannedSessions !== undefined ? { plannedSessions: input.plannedSessions } : {}),
          ...(input.status !== undefined ? { status: input.status } : {}),
          updatedAt: new Date(),
        })
        .where(eq(curriculumAssignments.id, id));

      return this.getById(id, scope);
    },

    async updateLearner(
      id: string,
      input: CurriculumLearnerUpdateInput,
      scope: CurriculumScope,
    ): Promise<CurriculumDetail | null> {
      const assignmentId = await assignmentIdForLearner(id, scope);
      if (!assignmentId) {
        return null;
      }

      await db
        .update(curriculumStageStudents)
        .set({
          ...(input.evidenceNote !== undefined ? { evidenceNote: input.evidenceNote } : {}),
          ...(input.projectId !== undefined ? { projectId: input.projectId } : {}),
          ...(input.status !== undefined ? { status: input.status } : {}),
          updatedAt: new Date(),
        })
        .where(eq(curriculumStageStudents.id, id));

      return this.getById(assignmentId, scope);
    },

    async updateStage(
      id: string,
      input: CurriculumStageUpdateInput,
      scope: CurriculumScope,
    ): Promise<CurriculumDetail | null> {
      const assignmentId = await assignmentIdForStage(id, scope);
      if (!assignmentId) {
        return null;
      }

      await db
        .update(curriculumStages)
        .set({
          ...(input.attachmentUrl !== undefined ? { attachmentUrl: input.attachmentUrl } : {}),
          ...(input.completedSessions !== undefined ? { completedSessions: input.completedSessions } : {}),
          ...(input.detail !== undefined ? { detail: input.detail } : {}),
          ...(input.nextTopic !== undefined ? { nextTopic: input.nextTopic } : {}),
          ...(input.plannedSessions !== undefined ? { plannedSessions: input.plannedSessions } : {}),
          ...(input.sequence !== undefined ? { sequence: input.sequence } : {}),
          ...(input.status !== undefined ? { status: input.status } : {}),
          ...(input.title !== undefined ? { title: input.title } : {}),
          updatedAt: new Date(),
        })
        .where(eq(curriculumStages.id, id));

      await recalculateAssignment(assignmentId);
      return this.getById(assignmentId, scope);
    },
  };
}
