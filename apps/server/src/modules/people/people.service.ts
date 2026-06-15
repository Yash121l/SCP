import type { SessionUser } from "@scp/contracts";
import type { AuditService } from "../audit/audit.service.js";
import { hubScope, institutionScope, isGlobalScope } from "../access/scope.js";
import type { createPeopleRepository } from "./people.repository.js";
import type { EmployeeCreateInput, EmployeeUpdateInput } from "./people.schemas.js";

export type PeopleService = ReturnType<typeof createPeopleService>;

export function createPeopleService({
  audit,
  repository,
}: {
  audit: AuditService;
  repository: ReturnType<typeof createPeopleRepository>;
}) {
  return {
    async create(user: SessionUser, input: EmployeeCreateInput) {
      const scopedHubId = hubScope(user);
      const employee = await repository.create({
        ...input,
        hubId: scopedHubId ?? input.hubId,
      });

      await audit.write({
        action: "Created incubator employee",
        actor: user,
        entityId: employee.id,
        entityType: "employee",
        metadata: { designation: employee.designation, hubId: employee.hubId },
      });

      return employee;
    },

    list(user: SessionUser) {
      return repository.list({
        canSeeAll: isGlobalScope(user),
        hubId: hubScope(user),
        institutionId: institutionScope(user),
      });
    },

    async remove(user: SessionUser, id: string) {
      const scope = {
        canSeeAll: isGlobalScope(user),
        hubId: hubScope(user),
        institutionId: institutionScope(user),
      };
      const existing = await repository.getById(id, scope);
      if (!existing) {
        return null;
      }

      const employee = await repository.remove(id);
      if (employee) {
        await audit.write({
          action: "Deleted incubator employee",
          actor: user,
          entityId: employee.id,
          entityType: "employee",
          metadata: { email: employee.email, name: employee.name },
        });
      }

      return employee;
    },

    async update(user: SessionUser, id: string, input: EmployeeUpdateInput) {
      const scope = {
        canSeeAll: isGlobalScope(user),
        hubId: hubScope(user),
        institutionId: institutionScope(user),
      };
      const existing = await repository.getById(id, scope);
      if (!existing) {
        return null;
      }

      const scopedHubId = hubScope(user);
      const employee = await repository.update(id, {
        ...input,
        hubId: scopedHubId ?? input.hubId,
      });

      if (employee) {
        await audit.write({
          action: "Updated incubator employee",
          actor: user,
          entityId: employee.id,
          entityType: "employee",
          metadata: { fields: Object.keys(input), name: employee.name },
        });
      }

      return employee;
    },
  };
}
