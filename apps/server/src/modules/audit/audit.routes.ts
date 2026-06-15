import type { FastifyInstance } from "fastify";
import type { Services } from "../../services.js";
import { authenticate, requirePermission } from "../../security/authenticate.js";

export async function registerAuditRoutes(app: FastifyInstance, services: Services) {
  app.get(
    "/audit",
    { preHandler: [authenticate(services.auth), requirePermission("audit:read")] },
    async () => ({
      audit: await services.audit.list(100),
    }),
  );
}

