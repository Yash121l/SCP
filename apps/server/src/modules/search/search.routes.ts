import type { FastifyInstance } from "fastify";
import type { Services } from "../../services.js";
import { authenticate, requirePermission } from "../../security/authenticate.js";
import { searchQuerySchema } from "./search.schemas.js";

export async function registerSearchRoutes(app: FastifyInstance, services: Services) {
  app.get(
    "/search",
    { preHandler: [authenticate(services.auth), requirePermission("search:read")] },
    async (request) => {
      const query = searchQuerySchema.parse(request.query);
      return {
        results: await services.search.search(request.user!, query.q),
      };
    },
  );
}
