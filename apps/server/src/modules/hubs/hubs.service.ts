import type { SessionUser } from "@scp/contracts";
import type { AuditService } from "../audit/audit.service.js";
import { hubScope, institutionScope, isGlobalScope } from "../access/scope.js";
import type { createHubRepository } from "./hubs.repository.js";
import type { HubCreateInput, HubUpdateInput } from "./hubs.schemas.js";

export type HubService = ReturnType<typeof createHubService>;

export function createHubService({
  audit,
  repository,
}: {
  audit: AuditService;
  repository: ReturnType<typeof createHubRepository>;
}) {
  return {
    async create(user: SessionUser, input: HubCreateInput) {
      const hub = await repository.create(input);

      await audit.write({
        action: "Created incubator",
        actor: user,
        entityId: hub.id,
        entityType: "hub",
        metadata: { code: hub.code, name: hub.name },
      });

      return hub;
    },

    getById(user: SessionUser, id: string) {
      return repository.getById(id, {
        canSeeAll: isGlobalScope(user),
        hubId: hubScope(user),
        institutionId: institutionScope(user),
      });
    },

    list(user: SessionUser) {
      return repository.list({
        canSeeAll: isGlobalScope(user),
        hubId: hubScope(user),
        institutionId: institutionScope(user),
      });
    },

    async remove(user: SessionUser, id: string) {
      const existing = await this.getById(user, id);
      if (!existing) {
        return null;
      }

      const hub = await repository.archive(id);
      if (hub) {
        await audit.write({
          action: "Archived incubator",
          actor: user,
          entityId: hub.id,
          entityType: "hub",
          metadata: { name: hub.name },
        });
      }

      return hub;
    },

    async update(user: SessionUser, id: string, input: HubUpdateInput) {
      const existing = await this.getById(user, id);
      if (!existing) {
        return null;
      }

      const hub = await repository.update(id, input);
      if (hub) {
        await audit.write({
          action: "Updated incubator",
          actor: user,
          entityId: hub.id,
          entityType: "hub",
          metadata: { fields: Object.keys(input), name: hub.name },
        });
      }

      return hub;
    },
  };
}
