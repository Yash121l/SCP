import type { FastifyInstance } from "fastify";
import type { Permission, ProfileSummary } from "@scp/contracts";
import { rolePermissions } from "@scp/contracts";
import type { Services } from "../../services.js";
import { authenticate, requirePermission } from "../../security/authenticate.js";

export async function registerProfileRoutes(app: FastifyInstance, services: Services) {
  app.get(
    "/profile",
    { preHandler: [authenticate(services.auth), requirePermission("profile:read")] },
    async (request) => {
      const user = request.user!;
      const permissions = Array.from(
        new Set(user.roles.flatMap((role) => rolePermissions[role])),
      ) as Permission[];

      const profile: ProfileSummary = {
        email: user.email,
        name: user.name,
        permissions,
        roles: user.roles,
        scope: {
          hubId: user.scope.hubId ?? null,
          institutionId: user.scope.institutionId ?? null,
          organizationName: user.scope.organizationName,
          organizationType: user.scope.organizationType,
          studentId: user.scope.studentId ?? null,
        },
        userId: user.id,
      };

      return { profile };
    },
  );
}
