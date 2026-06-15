import {
  hubEmployees,
  incubationHubs,
  institutions,
  organizations,
  students,
  type DatabaseClient,
} from "@scp/database";
import type { HubDetail, HubEmployee, IncubationHub, Institution, StudentRecord } from "@scp/contracts";
import { and, asc, eq } from "drizzle-orm";
import type { HubCreateInput, HubUpdateInput } from "./hubs.schemas.js";

type HubRow = typeof incubationHubs.$inferSelect;

function toHub(row: HubRow, counts: { employees: number; institutions: number; students: number }): IncubationHub {
  return {
    code: row.code,
    district: row.district,
    employeeCount: counts.employees,
    geographyNote: row.geographyNote,
    id: row.id,
    institutionCount: counts.institutions,
    latitude: row.latitude,
    longitude: row.longitude,
    name: row.name,
    performanceScore: row.performanceScore,
    region: row.region,
    status: row.status,
    studentCount: counts.students,
  };
}

function slugify(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "")
    .slice(0, 48);
}

export function createHubRepository(db: DatabaseClient) {
  async function countsForHub(hubId: string, institutionId?: string | null) {
    const institutionWhere = institutionId
      ? and(eq(institutions.hubId, hubId), eq(institutions.id, institutionId))
      : eq(institutions.hubId, hubId);
    const employeeWhere = institutionId
      ? and(eq(hubEmployees.hubId, hubId), eq(hubEmployees.institutionId, institutionId))
      : eq(hubEmployees.hubId, hubId);
    const studentWhere = institutionId
      ? and(eq(students.hubId, hubId), eq(students.institutionId, institutionId))
      : eq(students.hubId, hubId);

    const [institutionRows, employeeRows, studentRows] = await Promise.all([
      db.select({ id: institutions.id }).from(institutions).where(institutionWhere).limit(1000),
      db.select({ id: hubEmployees.id }).from(hubEmployees).where(employeeWhere).limit(1000),
      db.select({ id: students.id }).from(students).where(studentWhere).limit(10000),
    ]);

    return {
      employees: employeeRows.length,
      institutions: institutionRows.length,
      students: studentRows.length,
    };
  }

  function scopedWhere(input: { canSeeAll: boolean; hubId: string | null }, id?: string) {
    const scope = input.canSeeAll || !input.hubId ? undefined : eq(incubationHubs.id, input.hubId);
    return id ? and(eq(incubationHubs.id, id), scope) : scope;
  }

  async function getById(
    id: string,
    scope: { canSeeAll: boolean; hubId: string | null; institutionId?: string | null },
  ): Promise<HubDetail | null> {
    const [hub] = await db.select().from(incubationHubs).where(scopedWhere(scope, id)).limit(1);
    if (!hub) {
      return null;
    }

    const [institutionRows, employeeRows, studentRows] = await Promise.all([
      db
        .select({
          address: institutions.address,
          code: institutions.code,
          contactEmail: institutions.contactEmail,
          district: institutions.district,
          employeeCount: institutions.employeeCount,
          geographyNote: institutions.geographyNote,
          hubId: institutions.hubId,
          hubName: incubationHubs.name,
          id: institutions.id,
          latitude: institutions.latitude,
          longitude: institutions.longitude,
          name: institutions.name,
          performanceScore: institutions.performanceScore,
          principalName: institutions.principalName,
          projectCount: institutions.projectCount,
          region: institutions.region,
          status: institutions.status,
          studentCount: institutions.studentCount,
          type: institutions.type,
        })
        .from(institutions)
        .innerJoin(incubationHubs, eq(institutions.hubId, incubationHubs.id))
        .where(
          scope.institutionId
            ? and(eq(institutions.hubId, hub.id), eq(institutions.id, scope.institutionId))
            : eq(institutions.hubId, hub.id),
        )
        .orderBy(asc(institutions.name)),
      db
        .select({
          designation: hubEmployees.designation,
          email: hubEmployees.email,
          hubId: hubEmployees.hubId,
          hubName: incubationHubs.name,
          id: hubEmployees.id,
          institutionId: hubEmployees.institutionId,
          institutionName: institutions.name,
          name: hubEmployees.name,
          phone: hubEmployees.phone,
          status: hubEmployees.status,
        })
        .from(hubEmployees)
        .innerJoin(incubationHubs, eq(hubEmployees.hubId, incubationHubs.id))
        .leftJoin(institutions, eq(hubEmployees.institutionId, institutions.id))
        .where(
          scope.institutionId
            ? and(eq(hubEmployees.hubId, hub.id), eq(hubEmployees.institutionId, scope.institutionId))
            : eq(hubEmployees.hubId, hub.id),
        )
        .orderBy(asc(hubEmployees.name)),
      db
        .select({
          email: students.email,
          grade: students.grade,
          hubId: students.hubId,
          hubName: incubationHubs.name,
          id: students.id,
          institutionId: students.institutionId,
          institutionName: institutions.name,
          mentorEmployeeId: students.mentorEmployeeId,
          name: students.name,
          projectCount: students.projectCount,
          status: students.status,
        })
        .from(students)
        .innerJoin(incubationHubs, eq(students.hubId, incubationHubs.id))
        .innerJoin(institutions, eq(students.institutionId, institutions.id))
        .where(
          scope.institutionId
            ? and(eq(students.hubId, hub.id), eq(students.institutionId, scope.institutionId))
            : eq(students.hubId, hub.id),
        )
        .orderBy(asc(students.name))
        .limit(1000),
    ]);

    const institutionsList: Institution[] = institutionRows.map((row) => ({ ...row }));
    const employees: HubEmployee[] = employeeRows.map((row) => ({ ...row }));
    const studentList: StudentRecord[] = studentRows.map((row) => ({ ...row }));

    return {
      ...toHub(hub, await countsForHub(hub.id, scope.institutionId)),
      employees,
      institutions: institutionsList,
      students: studentList,
    };
  }

  return {
    async create(input: HubCreateInput): Promise<IncubationHub> {
      const [organization] = await db
        .insert(organizations)
        .values({
          name: input.name,
          region: input.region,
          slug: `${slugify(input.name)}-${Date.now().toString(36)}`,
          type: "hub",
        })
        .returning({ id: organizations.id });

      if (!organization) {
        throw new Error("Hub organization was not created");
      }

      const [hub] = await db
        .insert(incubationHubs)
        .values({
          code: input.code,
          district: input.district,
          geographyNote: input.geographyNote ?? `${input.district}, ${input.region}`,
          latitude: input.latitude ?? 0,
          longitude: input.longitude ?? 0,
          name: input.name,
          organizationId: organization.id,
          performanceScore: input.performanceScore ?? 0,
          region: input.region,
          status: input.status ?? "onboarding",
        })
        .returning();

      if (!hub) {
        throw new Error("Hub was not created");
      }

      return toHub(hub, { employees: 0, institutions: 0, students: 0 });
    },

    async getById(
      id: string,
      scope: { canSeeAll: boolean; hubId: string | null; institutionId?: string | null },
    ): Promise<HubDetail | null> {
      return getById(id, scope);
    },

    async archive(id: string): Promise<IncubationHub | null> {
      const [hub] = await db
        .update(incubationHubs)
        .set({ status: "archived", updatedAt: new Date() })
        .where(eq(incubationHubs.id, id))
        .returning();

      return hub ? toHub(hub, await countsForHub(hub.id)) : null;
    },

    async list(scope: {
      canSeeAll: boolean;
      hubId: string | null;
      institutionId?: string | null;
    }): Promise<IncubationHub[]> {
      const rows = await db
        .select()
        .from(incubationHubs)
        .where(scopedWhere(scope))
        .orderBy(asc(incubationHubs.name))
        .limit(100);

      return Promise.all(rows.map(async (row) => toHub(row, await countsForHub(row.id, scope.institutionId))));
    },

    async update(id: string, input: HubUpdateInput): Promise<IncubationHub | null> {
      const [hub] = await db
        .update(incubationHubs)
        .set({
          ...(input.code ? { code: input.code } : {}),
          ...(input.district ? { district: input.district } : {}),
          ...(input.geographyNote ? { geographyNote: input.geographyNote } : {}),
          ...(input.latitude !== undefined ? { latitude: input.latitude } : {}),
          ...(input.longitude !== undefined ? { longitude: input.longitude } : {}),
          ...(input.name ? { name: input.name } : {}),
          ...(input.performanceScore !== undefined ? { performanceScore: input.performanceScore } : {}),
          ...(input.region ? { region: input.region } : {}),
          ...(input.status ? { status: input.status } : {}),
          updatedAt: new Date(),
        })
        .where(eq(incubationHubs.id, id))
        .returning();

      return hub ? toHub(hub, await countsForHub(hub.id)) : null;
    },
  };
}
