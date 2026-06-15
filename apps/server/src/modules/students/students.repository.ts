import {
  hubEmployees,
  incubationHubs,
  institutions,
  students,
  type DatabaseClient,
} from "@scp/database";
import type { StudentDetail, StudentRecord } from "@scp/contracts";
import { and, asc, eq } from "drizzle-orm";
import type { StudentCreateInput, StudentUpdateInput } from "./students.schemas.js";

type StudentScope = {
  canSeeAll: boolean;
  hubId: string | null;
  institutionId?: string | null;
  studentId?: string | null;
};

export function createStudentRepository(db: DatabaseClient) {
  function baseSelect() {
    return db
      .select({
        email: students.email,
        grade: students.grade,
        hubId: students.hubId,
        hubName: incubationHubs.name,
        id: students.id,
        institutionId: students.institutionId,
        institutionName: institutions.name,
        mentorEmployeeId: students.mentorEmployeeId,
        mentorName: hubEmployees.name,
        name: students.name,
        projectCount: students.projectCount,
        status: students.status,
      })
      .from(students)
      .innerJoin(incubationHubs, eq(students.hubId, incubationHubs.id))
      .innerJoin(institutions, eq(students.institutionId, institutions.id))
      .leftJoin(hubEmployees, eq(students.mentorEmployeeId, hubEmployees.id));
  }

  function scopeWhere(scope: StudentScope) {
    if (scope.canSeeAll) {
      return undefined;
    }

    if (scope.studentId) {
      return eq(students.id, scope.studentId);
    }

    if (scope.institutionId) {
      return eq(students.institutionId, scope.institutionId);
    }

    return scope.hubId ? eq(students.hubId, scope.hubId) : undefined;
  }

  function toRecord(row: Awaited<ReturnType<ReturnType<typeof baseSelect>["execute"]>>[number]): StudentRecord {
    return {
      email: row.email,
      grade: row.grade,
      hubId: row.hubId,
      hubName: row.hubName,
      id: row.id,
      institutionId: row.institutionId,
      institutionName: row.institutionName,
      mentorEmployeeId: row.mentorEmployeeId,
      name: row.name,
      projectCount: row.projectCount,
      status: row.status,
    };
  }

  return {
    async create(input: StudentCreateInput & { hubId: string }): Promise<StudentRecord> {
      const [student] = await db
        .insert(students)
        .values({
          email: input.email,
          grade: input.grade,
          hubId: input.hubId,
          institutionId: input.institutionId,
          mentorEmployeeId: input.mentorEmployeeId,
          name: input.name,
          projectCount: input.projectCount ?? 0,
          status: input.status ?? "active",
        })
        .returning({ id: students.id });

      if (!student) {
        throw new Error("Student was not created");
      }

      const detail = await this.getById(student.id, { canSeeAll: true, hubId: null });
      if (!detail) {
        throw new Error("Student was not loaded after creation");
      }

      return detail;
    },

    async getInstitutionHubId(institutionId: string): Promise<string | null> {
      const [institution] = await db
        .select({ hubId: institutions.hubId })
        .from(institutions)
        .where(eq(institutions.id, institutionId))
        .limit(1);

      return institution?.hubId ?? null;
    },

    async getById(id: string, scope: StudentScope): Promise<StudentDetail | null> {
      const [row] = await baseSelect()
        .where(and(eq(students.id, id), scopeWhere(scope)))
        .limit(1);

      if (!row) {
        return null;
      }

      return {
        ...toRecord(row),
        mentorName: row.mentorName,
      };
    },

    async list(scope: StudentScope): Promise<StudentRecord[]> {
      const rows = await baseSelect().where(scopeWhere(scope)).orderBy(asc(students.name)).limit(500);
      return rows.map(toRecord);
    },

    async remove(id: string): Promise<StudentDetail | null> {
      const student = await this.getById(id, { canSeeAll: true, hubId: null });
      if (!student) {
        return null;
      }

      await db.delete(students).where(eq(students.id, id));
      return student;
    },

    async update(id: string, input: StudentUpdateInput & { hubId?: string }): Promise<StudentDetail | null> {
      const [student] = await db
        .update(students)
        .set({
          ...(input.email ? { email: input.email } : {}),
          ...(input.grade ? { grade: input.grade } : {}),
          ...(input.hubId ? { hubId: input.hubId } : {}),
          ...(input.institutionId ? { institutionId: input.institutionId } : {}),
          ...(input.mentorEmployeeId !== undefined ? { mentorEmployeeId: input.mentorEmployeeId } : {}),
          ...(input.name ? { name: input.name } : {}),
          ...(input.projectCount !== undefined ? { projectCount: input.projectCount } : {}),
          ...(input.status ? { status: input.status } : {}),
          updatedAt: new Date(),
        })
        .where(eq(students.id, id))
        .returning({ id: students.id });

      return student ? this.getById(student.id, { canSeeAll: true, hubId: null }) : null;
    },
  };
}
