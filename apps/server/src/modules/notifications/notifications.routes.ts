import type { FastifyInstance } from "fastify";
import type { Services } from "../../services.js";
import { authenticate, requirePermission } from "../../security/authenticate.js";

export async function registerNotificationRoutes(app: FastifyInstance, services: Services) {
  app.get(
    "/notifications",
    { preHandler: [authenticate(services.auth), requirePermission("notifications:read")] },
    async (request) => ({
      notifications: await services.notifications.list(request.user!),
    }),
  );
}
