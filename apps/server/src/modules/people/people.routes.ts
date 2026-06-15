import type { FastifyInstance } from "fastify";
import type { Services } from "../../services.js";
import { authenticate, requirePermission } from "../../security/authenticate.js";
import { employeeCreateSchema, employeeUpdateSchema, routeParamsWithIdSchema } from "./people.schemas.js";

export async function registerPeopleRoutes(app: FastifyInstance, services: Services) {
  app.get(
    "/people",
    { preHandler: [authenticate(services.auth), requirePermission("people:read")] },
    async (request) => ({
      employees: await services.people.list(request.user!),
    }),
  );

  app.post(
    "/people",
    { preHandler: [authenticate(services.auth), requirePermission("people:manage")] },
    async (request, reply) => {
      const employee = await services.people.create(request.user!, employeeCreateSchema.parse(request.body));
      return reply.code(201).send({ employee });
    },
  );

  app.patch(
    "/people/:id",
    { preHandler: [authenticate(services.auth), requirePermission("people:manage")] },
    async (request, reply) => {
      const params = routeParamsWithIdSchema.parse(request.params);
      const employee = await services.people.update(
        request.user!,
        params.id,
        employeeUpdateSchema.parse(request.body),
      );

      if (!employee) {
        return reply.code(404).send({ message: "Employee not found" });
      }

      return { employee };
    },
  );

  app.delete(
    "/people/:id",
    { preHandler: [authenticate(services.auth), requirePermission("people:manage")] },
    async (request, reply) => {
      const params = routeParamsWithIdSchema.parse(request.params);
      const employee = await services.people.remove(request.user!, params.id);

      if (!employee) {
        return reply.code(404).send({ message: "Employee not found" });
      }

      return { employee };
    },
  );
}
