import type { FastifyInstance } from "fastify";
import type { Services } from "../../services.js";
import { authenticate, requirePermission } from "../../security/authenticate.js";
import {
  projectCreateSchema,
  projectStatusUpdateSchema,
  projectUpdateSchema,
  routeParamsWithIdSchema,
} from "./projects.schemas.js";

export async function registerProjectRoutes(app: FastifyInstance, services: Services) {
  app.get(
    "/projects",
    { preHandler: [authenticate(services.auth), requirePermission("projects:read")] },
    async (request) => ({
      projects: await services.projects.list(request.user!),
    }),
  );

  app.post(
    "/projects",
    { preHandler: [authenticate(services.auth), requirePermission("projects:manage")] },
    async (request, reply) => {
      const project = await services.projects.create(
        request.user!,
        projectCreateSchema.parse(request.body),
      );
      return reply.code(201).send({ project });
    },
  );

  app.get(
    "/projects/:id",
    { preHandler: [authenticate(services.auth), requirePermission("projects:read")] },
    async (request, reply) => {
      const params = routeParamsWithIdSchema.parse(request.params);
      const project = await services.projects.getById(request.user!, params.id);

      if (!project) {
        return reply.code(404).send({ message: "Project not found" });
      }

      return { project };
    },
  );

  app.patch(
    "/projects/:id/status",
    { preHandler: [authenticate(services.auth), requirePermission("projects:manage")] },
    async (request, reply) => {
      const params = routeParamsWithIdSchema.parse(request.params);
      const project = await services.projects.updateStatus(
        request.user!,
        params.id,
        projectStatusUpdateSchema.parse(request.body),
      );

      if (!project) {
        return reply.code(404).send({ message: "Project not found" });
      }

      return { project };
    },
  );

  app.patch(
    "/projects/:id",
    { preHandler: [authenticate(services.auth), requirePermission("projects:manage")] },
    async (request, reply) => {
      const params = routeParamsWithIdSchema.parse(request.params);
      const project = await services.projects.update(
        request.user!,
        params.id,
        projectUpdateSchema.parse(request.body),
      );

      if (!project) {
        return reply.code(404).send({ message: "Project not found" });
      }

      return { project };
    },
  );

  app.delete(
    "/projects/:id",
    { preHandler: [authenticate(services.auth), requirePermission("projects:manage")] },
    async (request, reply) => {
      const params = routeParamsWithIdSchema.parse(request.params);
      const project = await services.projects.remove(request.user!, params.id);

      if (!project) {
        return reply.code(404).send({ message: "Project not found" });
      }

      return { project };
    },
  );
}
