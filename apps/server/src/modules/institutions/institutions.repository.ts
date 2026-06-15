import { hubEmployees, incubationHubs, institutions, organizations, students, type DatabaseClient } from "@scp/database";
import type { Institution, InstitutionDetail } from "@scp/contracts";
import { and, asc, eq } from "drizzle-orm";
import type { InstitutionCreateInput, InstitutionStatusInput, InstitutionUpdateInput } from "./institutions.schemas.js";

type InstitutionRow = {
  address: string;
  code: string;
  contactEmail: string;
  district: string;
  employeeCount: number;
  geographyNote: string;
  hubId: string;
  hubName: string;
  id: string;
  latitude: number;
  longitude: number;
  name: string;
  performanceScore: number;
  principalName: string;
  projectCount: number;
  region: string;
  status: "active" | "onboarding" | "attention" | "archived";
  studentCount: number;
  type: "school" | "college" | "polytechnic" | "iti";
};

function toInstitution(row: InstitutionRow): Institution {
  return {
    address: row.address,
    code: row.code,
    contactEmail: row.contactEmail,
    district: row.district,
    employeeCount: row.employeeCount,
    geographyNote: row.geographyNote,
    hubId: row.hubId,
    hubName: row.hubName,
    id: row.id,
    latitude: row.latitude,
    longitude: row.longitude,
    name: row.name,
    performanceScore: row.performanceScore,
    principalName: row.principalName,
    projectCount: row.projectCount,
    region: row.region,
    status: row.status,
    studentCount: row.studentCount,
    type: row.type,
  };
}

function slugify(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "")
    .slice(0, 48);
}

export function createInstitutionRepository(db: DatabaseClient) {
  function baseSelect() {
    return db
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
      .innerJoin(incubationHubs, eq(institutions.hubId, incubationHubs.id));
  }

  function scopedWhere(input: { canSeeAll: boolean; hubId: string | null; institutionId?: string | null }) {
    if (input.canSeeAll) {
      return undefined;
    }

    if (input.institutionId) {
      return eq(institutions.id, input.institutionId);
    }

    return input.hubId ? eq(institutions.hubId, input.hubId) : undefined;
  }

  return {
    async create(input: InstitutionCreateInput): Promise<Institution> {
      const slugBase = input.organizationSlug ?? slugify(input.name);
      const slug = `${slugBase}-${Date.now().toString(36)}`;
      const code = input.code ?? slugify(input.name).toUpperCase().slice(0, 28);

      const [organization] = await db
        .insert(organizations)
        .values({
          name: input.name,
          region: input.region,
          slug,
          type: "institution",
        })
        .returning({ id: organizations.id });

      const [institution] = await db
        .insert(institutions)
        .values({
          address: input.address,
          code,
          contactEmail: input.contactEmail,
          district: input.district,
          employeeCount: input.employeeCount ?? 0,
          geographyNote: input.geographyNote ?? `${input.address}, ${input.district}`,
          hubId: input.hubId,
          latitude: input.latitude ?? 0,
          longitude: input.longitude ?? 0,
          name: input.name,
          organizationId: organization?.id,
          performanceScore: input.performanceScore ?? 0,
          principalName: input.principalName,
          projectCount: input.projectCount ?? 0,
          region: input.region,
          status: input.status ?? "onboarding",
          studentCount: input.studentCount ?? 0,
          type: input.type,
        })
        .returning();

      if (!institution) {
        throw new Error("Institution was not created");
      }

      const detail = await this.getById(institution.id, { canSeeAll: true, hubId: null });
      if (!detail) {
        throw new Error("Institution was not loaded after creation");
      }

      return detail;
    },

    async getById(
      id: string,
      scope: { canSeeAll: boolean; hubId: string | null; institutionId?: string | null },
    ): Promise<InstitutionDetail | null> {
      const whereClause = and(eq(institutions.id, id), scopedWhere(scope));
      const [row] = await baseSelect().where(whereClause).limit(1);

      if (!row) {
        return null;
      }

      const [employeeRows, studentRows] = await Promise.all([
        db
          .select({ id: hubEmployees.id })
          .from(hubEmployees)
          .where(eq(hubEmployees.institutionId, id))
          .limit(1000),
        db
          .select({ status: students.status })
          .from(students)
          .where(eq(students.institutionId, id))
          .limit(5000),
      ]);

      const counts = new Map<string, number>();
      for (const student of studentRows) {
        counts.set(student.status, (counts.get(student.status) ?? 0) + 1);
      }

      return {
        ...toInstitution(row),
        employeeAssignmentCount: employeeRows.length,
        studentsByStatus: ["active", "paused", "graduated"].map((label) => ({
          label,
          value: counts.get(label) ?? 0,
        })),
      };
    },

    async list(scope: { canSeeAll: boolean; hubId: string | null; institutionId?: string | null }): Promise<Institution[]> {
      const rows = await baseSelect()
        .where(scopedWhere(scope))
        .orderBy(asc(institutions.name))
        .limit(200);

      return rows.map(toInstitution);
    },

    async updateStatus(id: string, input: InstitutionStatusInput): Promise<Institution | null> {
      const [institution] = await db
        .update(institutions)
        .set({
          status: input.status,
          updatedAt: new Date(),
        })
        .where(and(eq(institutions.id, id)))
        .returning();

      if (!institution) {
        return null;
      }

      return this.getById(institution.id, { canSeeAll: true, hubId: null });
    },

    async archive(id: string): Promise<Institution | null> {
      const [institution] = await db
        .update(institutions)
        .set({ status: "archived", updatedAt: new Date() })
        .where(eq(institutions.id, id))
        .returning({ id: institutions.id });

      return institution ? this.getById(institution.id, { canSeeAll: true, hubId: null }) : null;
    },

    async update(id: string, input: InstitutionUpdateInput): Promise<Institution | null> {
      const [institution] = await db
        .update(institutions)
        .set({
          ...(input.address ? { address: input.address } : {}),
          ...(input.code ? { code: input.code } : {}),
          ...(input.contactEmail ? { contactEmail: input.contactEmail } : {}),
          ...(input.district ? { district: input.district } : {}),
          ...(input.employeeCount !== undefined ? { employeeCount: input.employeeCount } : {}),
          ...(input.geographyNote ? { geographyNote: input.geographyNote } : {}),
          ...(input.hubId ? { hubId: input.hubId } : {}),
          ...(input.latitude !== undefined ? { latitude: input.latitude } : {}),
          ...(input.longitude !== undefined ? { longitude: input.longitude } : {}),
          ...(input.name ? { name: input.name } : {}),
          ...(input.performanceScore !== undefined ? { performanceScore: input.performanceScore } : {}),
          ...(input.principalName ? { principalName: input.principalName } : {}),
          ...(input.projectCount !== undefined ? { projectCount: input.projectCount } : {}),
          ...(input.region ? { region: input.region } : {}),
          ...(input.status ? { status: input.status } : {}),
          ...(input.studentCount !== undefined ? { studentCount: input.studentCount } : {}),
          ...(input.type ? { type: input.type } : {}),
          updatedAt: new Date(),
        })
        .where(eq(institutions.id, id))
        .returning({ id: institutions.id });

      return institution ? this.getById(institution.id, { canSeeAll: true, hubId: null }) : null;
    },
  };
}
