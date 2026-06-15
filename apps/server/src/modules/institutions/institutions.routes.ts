import type { FastifyInstance } from "fastify";
import type { Services } from "../../services.js";
import { authenticate, requirePermission } from "../../security/authenticate.js";
import {
  institutionCreateSchema,
  institutionStatusSchema,
  institutionUpdateSchema,
  routeParamsWithIdSchema,
} from "./institutions.schemas.js";

export async function registerInstitutionRoutes(app: FastifyInstance, services: Services) {
  app.get(
    "/institutions",
    { preHandler: [authenticate(services.auth), requirePermission("institutions:read")] },
    async (request) => ({
      institutions: await services.institutions.list(request.user!),
    }),
  );

  app.post(
    "/institutions",
    { preHandler: [authenticate(services.auth), requirePermission("institutions:manage")] },
    async (request, reply) => {
      const institution = await services.institutions.create(
        request.user!,
        institutionCreateSchema.parse(request.body),
      );
      return reply.code(201).send({ institution });
    },
  );

  app.get(
    "/institutions/:id",
    { preHandler: [authenticate(services.auth), requirePermission("institutions:read")] },
    async (request, reply) => {
      const params = routeParamsWithIdSchema.parse(request.params);
      const institution = await services.institutions.getById(request.user!, params.id);

      if (!institution) {
        return reply.code(404).send({ message: "School not found" });
      }

      return { institution };
    },
  );

  app.patch(
    "/institutions/:id/status",
    { preHandler: [authenticate(services.auth), requirePermission("institutions:manage")] },
    async (request, reply) => {
      const params = routeParamsWithIdSchema.parse(request.params);
      const institution = await services.institutions.updateStatus(
        request.user!,
        params.id,
        institutionStatusSchema.parse(request.body),
      );

      if (!institution) {
        return reply.code(404).send({ message: "School not found" });
      }

      return { institution };
    },
  );

  app.patch(
    "/institutions/:id",
    { preHandler: [authenticate(services.auth), requirePermission("institutions:manage")] },
    async (request, reply) => {
      const params = routeParamsWithIdSchema.parse(request.params);
      const institution = await services.institutions.update(
        request.user!,
        params.id,
        institutionUpdateSchema.parse(request.body),
      );

      if (!institution) {
        return reply.code(404).send({ message: "School not found" });
      }

      return { institution };
    },
  );

  app.delete(
    "/institutions/:id",
    { preHandler: [authenticate(services.auth), requirePermission("institutions:manage")] },
    async (request, reply) => {
      const params = routeParamsWithIdSchema.parse(request.params);
      const institution = await services.institutions.remove(request.user!, params.id);

      if (!institution) {
        return reply.code(404).send({ message: "School not found" });
      }

      return { institution };
    },
  );
}
