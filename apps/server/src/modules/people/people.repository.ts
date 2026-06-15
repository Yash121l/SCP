import { hubEmployees, incubationHubs, institutions, type DatabaseClient } from "@scp/database";
import type { HubEmployee } from "@scp/contracts";
import { and, asc, eq } from "drizzle-orm";
import type { EmployeeCreateInput, EmployeeUpdateInput } from "./people.schemas.js";

export function createPeopleRepository(db: DatabaseClient) {
  function baseSelect() {
    return db
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
      .leftJoin(institutions, eq(hubEmployees.institutionId, institutions.id));
  }

  return {
    async create(input: EmployeeCreateInput): Promise<HubEmployee> {
      const [employee] = await db
        .insert(hubEmployees)
        .values({
          designation: input.designation,
          email: input.email,
          hubId: input.hubId,
          institutionId: input.institutionId,
          name: input.name,
          phone: input.phone,
          status: input.status ?? "invited",
        })
        .returning({ id: hubEmployees.id });

      if (!employee) {
        throw new Error("Employee was not created");
      }

      const [row] = await baseSelect().where(eq(hubEmployees.id, employee.id)).limit(1);
      if (!row) {
        throw new Error("Employee was not loaded after creation");
      }

      return row;
    },

    async list(scope: {
      canSeeAll: boolean;
      hubId: string | null;
      institutionId?: string | null;
    }): Promise<HubEmployee[]> {
      const whereClause = scope.canSeeAll
        ? undefined
        : scope.institutionId
          ? eq(hubEmployees.institutionId, scope.institutionId)
          : scope.hubId
            ? eq(hubEmployees.hubId, scope.hubId)
            : undefined;
      return baseSelect().where(whereClause).orderBy(asc(hubEmployees.name)).limit(300);
    },

    async getById(
      id: string,
      scope: { canSeeAll: boolean; hubId: string | null; institutionId?: string | null },
    ): Promise<HubEmployee | null> {
      const scopeWhere = scope.canSeeAll
        ? undefined
        : scope.institutionId
          ? eq(hubEmployees.institutionId, scope.institutionId)
          : scope.hubId
            ? eq(hubEmployees.hubId, scope.hubId)
            : undefined;
      const [employee] = await baseSelect().where(and(eq(hubEmployees.id, id), scopeWhere)).limit(1);
      return employee ?? null;
    },

    async remove(id: string): Promise<HubEmployee | null> {
      const [employee] = await baseSelect().where(eq(hubEmployees.id, id)).limit(1);
      if (!employee) {
        return null;
      }

      await db.delete(hubEmployees).where(eq(hubEmployees.id, id));
      return employee;
    },

    async update(id: string, input: EmployeeUpdateInput): Promise<HubEmployee | null> {
      const [employee] = await db
        .update(hubEmployees)
        .set({
          ...(input.designation ? { designation: input.designation } : {}),
          ...(input.email ? { email: input.email } : {}),
          ...(input.hubId ? { hubId: input.hubId } : {}),
          ...(input.institutionId !== undefined ? { institutionId: input.institutionId } : {}),
          ...(input.name ? { name: input.name } : {}),
          ...(input.phone !== undefined ? { phone: input.phone } : {}),
          ...(input.status ? { status: input.status } : {}),
          updatedAt: new Date(),
        })
        .where(eq(hubEmployees.id, id))
        .returning({ id: hubEmployees.id });

      if (!employee) {
        return null;
      }

      const [row] = await baseSelect().where(eq(hubEmployees.id, employee.id)).limit(1);
      return row ?? null;
    },
  };
}
