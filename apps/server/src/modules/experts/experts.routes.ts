import type { FastifyInstance } from "fastify";
import type { Services } from "../../services.js";
import { authenticate, requirePermission } from "../../security/authenticate.js";
import { projectFeedbackSchema, routeParamsWithIdSchema } from "./experts.schemas.js";

export async function registerExpertRoutes(app: FastifyInstance, services: Services) {
  app.get(
    "/experts",
    { preHandler: [authenticate(services.auth), requirePermission("experts:read")] },
    async () => ({
      experts: await services.experts.list(),
    }),
  );

  app.get(
    "/projects/:id/feedback",
    { preHandler: [authenticate(services.auth), requirePermission("projects:read")] },
    async (request) => {
      const params = routeParamsWithIdSchema.parse(request.params);
      return {
        feedback: await services.experts.listFeedback(params.id),
      };
    },
  );

  app.post(
    "/projects/:id/feedback",
    { preHandler: [authenticate(services.auth), requirePermission("project_feedback:manage")] },
    async (request, reply) => {
      const params = routeParamsWithIdSchema.parse(request.params);
      const feedback = await services.experts.createFeedback(
        request.user!,
        params.id,
        projectFeedbackSchema.parse(request.body),
      );

      return reply.code(201).send({ feedback });
    },
  );
}
