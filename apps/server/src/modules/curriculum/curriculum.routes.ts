import type { FastifyInstance } from "fastify";
import { z } from "zod";
import type { Services } from "../../services.js";
import { authenticate, requirePermission } from "../../security/authenticate.js";

const routeParamsWithIdSchema = z.object({
  id: z.string().uuid(),
});

export async function registerCurriculumRoutes(app: FastifyInstance, services: Services) {
  app.get(
    "/curriculum",
    { preHandler: [authenticate(services.auth), requirePermission("curriculum:read")] },
    async (request) => ({
      curriculum: await services.curriculum.list(request.user!),
    }),
  );

  app.get(
    "/curriculum/:id",
    { preHandler: [authenticate(services.auth), requirePermission("curriculum:read")] },
    async (request, reply) => {
      const params = routeParamsWithIdSchema.parse(request.params);
      const curriculum = await services.curriculum.getById(request.user!, params.id);

      if (!curriculum) {
        return reply.code(404).send({ message: "Curriculum assignment not found" });
      }

      return { curriculum };
    },
  );
}
