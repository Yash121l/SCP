import type { FastifyInstance } from "fastify";
import type { Services } from "../../services.js";
import { authenticate, requirePermission } from "../../security/authenticate.js";

export async function registerDashboardRoutes(app: FastifyInstance, services: Services) {
  app.get(
    "/dashboard",
    { preHandler: [authenticate(services.auth), requirePermission("dashboard:read")] },
    async (request) => services.dashboard.getSummary(request.user!),
  );
}

