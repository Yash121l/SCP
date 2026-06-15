import type { FastifyInstance } from "fastify";
import type { Services } from "../../services.js";
import { authenticate, requirePermission } from "../../security/authenticate.js";
import {
  curriculumAssignmentUpdateSchema,
  curriculumLearnerUpdateSchema,
  curriculumStageUpdateSchema,
  routeParamsWithIdSchema,
} from "./curriculum.schemas.js";

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

  app.patch(
    "/curriculum/:id",
    { preHandler: [authenticate(services.auth), requirePermission("curriculum:manage")] },
    async (request, reply) => {
      const params = routeParamsWithIdSchema.parse(request.params);
      const curriculum = await services.curriculum.updateAssignment(
        request.user!,
        params.id,
        curriculumAssignmentUpdateSchema.parse(request.body),
      );

      if (!curriculum) {
        return reply.code(404).send({ message: "Curriculum assignment not found" });
      }

      return { curriculum };
    },
  );

  app.patch(
    "/curriculum/learners/:id",
    { preHandler: [authenticate(services.auth), requirePermission("curriculum:manage")] },
    async (request, reply) => {
      const params = routeParamsWithIdSchema.parse(request.params);
      const curriculum = await services.curriculum.updateLearner(
        request.user!,
        params.id,
        curriculumLearnerUpdateSchema.parse(request.body),
      );

      if (!curriculum) {
        return reply.code(404).send({ message: "Curriculum learner not found" });
      }

      return { curriculum };
    },
  );

  app.patch(
    "/curriculum/stages/:id",
    { preHandler: [authenticate(services.auth), requirePermission("curriculum:manage")] },
    async (request, reply) => {
      const params = routeParamsWithIdSchema.parse(request.params);
      const curriculum = await services.curriculum.updateStage(
        request.user!,
        params.id,
        curriculumStageUpdateSchema.parse(request.body),
      );

      if (!curriculum) {
        return reply.code(404).send({ message: "Curriculum stage not found" });
      }

      return { curriculum };
    },
  );
}
