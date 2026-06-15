import type { FastifyInstance } from "fastify";
import type { Services } from "../../services.js";
import { authenticate, requirePermission } from "../../security/authenticate.js";
import { hubCreateSchema, hubUpdateSchema, routeParamsWithIdSchema } from "./hubs.schemas.js";

export async function registerHubRoutes(app: FastifyInstance, services: Services) {
  app.get(
    "/hubs",
    { preHandler: [authenticate(services.auth), requirePermission("hubs:read")] },
    async (request) => ({
      hubs: await services.hubs.list(request.user!),
    }),
  );

  app.post(
    "/hubs",
    { preHandler: [authenticate(services.auth), requirePermission("hubs:manage")] },
    async (request, reply) => {
      const hub = await services.hubs.create(request.user!, hubCreateSchema.parse(request.body));
      return reply.code(201).send({ hub });
    },
  );

  app.get(
    "/hubs/:id",
    { preHandler: [authenticate(services.auth), requirePermission("hubs:read")] },
    async (request, reply) => {
      const params = routeParamsWithIdSchema.parse(request.params);
      const hub = await services.hubs.getById(request.user!, params.id);

      if (!hub) {
        return reply.code(404).send({ message: "Incubator not found" });
      }

      return { hub };
    },
  );

  app.patch(
    "/hubs/:id",
    { preHandler: [authenticate(services.auth), requirePermission("hubs:manage")] },
    async (request, reply) => {
      const params = routeParamsWithIdSchema.parse(request.params);
      const hub = await services.hubs.update(request.user!, params.id, hubUpdateSchema.parse(request.body));

      if (!hub) {
        return reply.code(404).send({ message: "Incubator not found" });
      }

      return { hub };
    },
  );

  app.delete(
    "/hubs/:id",
    { preHandler: [authenticate(services.auth), requirePermission("hubs:manage")] },
    async (request, reply) => {
      const params = routeParamsWithIdSchema.parse(request.params);
      const hub = await services.hubs.remove(request.user!, params.id);

      if (!hub) {
        return reply.code(404).send({ message: "Incubator not found" });
      }

      return { hub };
    },
  );
}
