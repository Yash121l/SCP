import {
  incubationHubs,
  institutions,
  studentProjects,
  students,
  type DatabaseClient,
} from "@scp/database";
import type { StudentProject } from "@scp/contracts";
import { and, desc, eq, sql } from "drizzle-orm";
import type { ProjectCreateInput, ProjectStatusUpdateInput, ProjectUpdateInput } from "./projects.schemas.js";

type ProjectScope = {
  canSeeAll: boolean;
  hubId: string | null;
  institutionId?: string | null;
  studentId?: string | null;
};

type ProjectTarget = {
  hubId: string;
  hubName: string;
  institutionId: string;
  institutionName: string;
  ownerEmail: string;
  ownerName: string;
  studentId: string | null;
  studentName: string | null;
};

type ProjectRow = {
  approvalId: string | null;
  createdAt: Date;
  domain: string;
  hubId: string;
  hubName: string;
  id: string;
  institutionId: string;
  institutionName: string;
  ownerEmail: string;
  ownerName: string;
  problemStatement: string;
  reviewNote: string | null;
  solutionSummary: string;
  status: StudentProject["status"];
  studentId: string | null;
  studentName: string | null;
  title: string;
  updatedAt: Date;
};

function toProject(row: ProjectRow): StudentProject {
  return {
    approvalId: row.approvalId,
    createdAt: row.createdAt.toISOString(),
    domain: row.domain,
    hubId: row.hubId,
    hubName: row.hubName,
    id: row.id,
    institutionId: row.institutionId,
    institutionName: row.institutionName,
    ownerEmail: row.ownerEmail,
    ownerName: row.ownerName,
    problemStatement: row.problemStatement,
    reviewNote: row.reviewNote,
    solutionSummary: row.solutionSummary,
    status: row.status,
    studentId: row.studentId,
    studentName: row.studentName,
    title: row.title,
    updatedAt: row.updatedAt.toISOString(),
  };
}

export function createProjectRepository(db: DatabaseClient) {
  function baseSelect() {
    return db
      .select({
        approvalId: studentProjects.approvalId,
        createdAt: studentProjects.createdAt,
        domain: studentProjects.domain,
        hubId: studentProjects.hubId,
        hubName: incubationHubs.name,
        id: studentProjects.id,
        institutionId: studentProjects.institutionId,
        institutionName: institutions.name,
        ownerEmail: studentProjects.ownerEmail,
        ownerName: studentProjects.ownerName,
        problemStatement: studentProjects.problemStatement,
        reviewNote: studentProjects.reviewNote,
        solutionSummary: studentProjects.solutionSummary,
        status: studentProjects.status,
        studentId: studentProjects.studentId,
        studentName: students.name,
        title: studentProjects.title,
        updatedAt: studentProjects.updatedAt,
      })
      .from(studentProjects)
      .innerJoin(incubationHubs, eq(studentProjects.hubId, incubationHubs.id))
      .innerJoin(institutions, eq(studentProjects.institutionId, institutions.id))
      .leftJoin(students, eq(studentProjects.studentId, students.id));
  }

  function scopeWhere(scope: ProjectScope) {
    if (scope.canSeeAll) {
      return undefined;
    }

    if (scope.studentId) {
      return eq(studentProjects.studentId, scope.studentId);
    }

    if (scope.institutionId) {
      return eq(studentProjects.institutionId, scope.institutionId);
    }

    return scope.hubId ? eq(studentProjects.hubId, scope.hubId) : undefined;
  }

  return {
    async attachApproval(projectId: string, approvalId: string): Promise<void> {
      await db
        .update(studentProjects)
        .set({ approvalId, updatedAt: new Date() })
        .where(eq(studentProjects.id, projectId));
    },

    async create(
      input: ProjectCreateInput & ProjectTarget & { createdByUserId: string },
    ): Promise<StudentProject> {
      const [project] = await db
        .insert(studentProjects)
        .values({
          createdByUserId: input.createdByUserId,
          domain: input.domain,
          hubId: input.hubId,
          institutionId: input.institutionId,
          ownerEmail: input.ownerEmail,
          ownerName: input.ownerName,
          problemStatement: input.problemStatement,
          solutionSummary: input.solutionSummary,
          status: "proposed",
          studentId: input.studentId,
          title: input.title,
        })
        .returning({ id: studentProjects.id });

      if (!project) {
        throw new Error("Project was not created");
      }

      await db
        .update(institutions)
        .set({
          projectCount: sql`${institutions.projectCount} + 1`,
          updatedAt: new Date(),
        })
        .where(eq(institutions.id, input.institutionId));

      if (input.studentId) {
        await db
          .update(students)
          .set({
            projectCount: sql`${students.projectCount} + 1`,
            updatedAt: new Date(),
          })
          .where(eq(students.id, input.studentId));
      }

      const detail = await this.getById(project.id, { canSeeAll: true, hubId: null });
      if (!detail) {
        throw new Error("Project was not loaded after creation");
      }

      return detail;
    },

    async getById(id: string, scope: ProjectScope): Promise<StudentProject | null> {
      const [row] = await baseSelect()
        .where(and(eq(studentProjects.id, id), scopeWhere(scope)))
        .limit(1);

      return row ? toProject(row) : null;
    },

    async list(scope: ProjectScope): Promise<StudentProject[]> {
      const rows = await baseSelect()
        .where(scopeWhere(scope))
        .orderBy(desc(studentProjects.createdAt))
        .limit(500);

      return rows.map(toProject);
    },

    async resolveTarget(input: {
      institutionId?: string | null;
      ownerEmail?: string;
      ownerName?: string;
      studentId?: string | null;
    }): Promise<ProjectTarget | null> {
      if (input.studentId) {
        const [student] = await db
          .select({
            email: students.email,
            hubId: students.hubId,
            hubName: incubationHubs.name,
            institutionId: students.institutionId,
            institutionName: institutions.name,
            name: students.name,
          })
          .from(students)
          .innerJoin(incubationHubs, eq(students.hubId, incubationHubs.id))
          .innerJoin(institutions, eq(students.institutionId, institutions.id))
          .where(eq(students.id, input.studentId))
          .limit(1);

        if (!student) {
          return null;
        }

        return {
          hubId: student.hubId,
          hubName: student.hubName,
          institutionId: student.institutionId,
          institutionName: student.institutionName,
          ownerEmail: input.ownerEmail ?? student.email,
          ownerName: input.ownerName ?? student.name,
          studentId: input.studentId,
          studentName: student.name,
        };
      }

      if (!input.institutionId) {
        return null;
      }

      const [institution] = await db
        .select({
          contactEmail: institutions.contactEmail,
          hubId: institutions.hubId,
          hubName: incubationHubs.name,
          id: institutions.id,
          name: institutions.name,
        })
        .from(institutions)
        .innerJoin(incubationHubs, eq(institutions.hubId, incubationHubs.id))
        .where(eq(institutions.id, input.institutionId))
        .limit(1);

      if (!institution) {
        return null;
      }

      return {
        hubId: institution.hubId,
        hubName: institution.hubName,
        institutionId: institution.id,
        institutionName: institution.name,
        ownerEmail: input.ownerEmail ?? institution.contactEmail,
        ownerName: input.ownerName ?? institution.name,
        studentId: null,
        studentName: null,
      };
    },

    async updateStatus(
      id: string,
      input: ProjectStatusUpdateInput & { updatedByUserId: string },
    ): Promise<StudentProject | null> {
      const [project] = await db
        .update(studentProjects)
        .set({
          reviewNote: input.reviewNote,
          status: input.status,
          updatedAt: new Date(),
          updatedByUserId: input.updatedByUserId,
        })
        .where(eq(studentProjects.id, id))
        .returning({ id: studentProjects.id });

      return project ? this.getById(project.id, { canSeeAll: true, hubId: null }) : null;
    },

    async remove(id: string): Promise<StudentProject | null> {
      const project = await this.getById(id, { canSeeAll: true, hubId: null });
      if (!project) {
        return null;
      }

      await db.delete(studentProjects).where(eq(studentProjects.id, id));
      return project;
    },

    async update(
      id: string,
      input: ProjectUpdateInput & Partial<ProjectTarget> & { updatedByUserId: string },
    ): Promise<StudentProject | null> {
      const [project] = await db
        .update(studentProjects)
        .set({
          ...(input.domain ? { domain: input.domain } : {}),
          ...(input.hubId ? { hubId: input.hubId } : {}),
          ...(input.institutionId ? { institutionId: input.institutionId } : {}),
          ...(input.ownerEmail ? { ownerEmail: input.ownerEmail } : {}),
          ...(input.ownerName ? { ownerName: input.ownerName } : {}),
          ...(input.problemStatement ? { problemStatement: input.problemStatement } : {}),
          ...(input.reviewNote !== undefined ? { reviewNote: input.reviewNote } : {}),
          ...(input.solutionSummary ? { solutionSummary: input.solutionSummary } : {}),
          ...(input.status ? { status: input.status } : {}),
          ...(input.studentId !== undefined ? { studentId: input.studentId } : {}),
          ...(input.title ? { title: input.title } : {}),
          updatedAt: new Date(),
          updatedByUserId: input.updatedByUserId,
        })
        .where(eq(studentProjects.id, id))
        .returning({ id: studentProjects.id });

      return project ? this.getById(project.id, { canSeeAll: true, hubId: null }) : null;
    },
  };
}
