import type { FastifyInstance } from "fastify";
import type { Services } from "../../services.js";
import { authenticate, requirePermission } from "../../security/authenticate.js";
import { routeParamsWithIdSchema, studentCreateSchema, studentUpdateSchema } from "./students.schemas.js";

export async function registerStudentRoutes(app: FastifyInstance, services: Services) {
  app.get(
    "/students",
    { preHandler: [authenticate(services.auth), requirePermission("students:read")] },
    async (request) => ({
      students: await services.students.list(request.user!),
    }),
  );

  app.post(
    "/students",
    { preHandler: [authenticate(services.auth), requirePermission("students:manage")] },
    async (request, reply) => {
      const student = await services.students.create(request.user!, studentCreateSchema.parse(request.body));
      return reply.code(201).send({ student });
    },
  );

  app.get(
    "/students/:id",
    { preHandler: [authenticate(services.auth), requirePermission("students:read")] },
    async (request, reply) => {
      const params = routeParamsWithIdSchema.parse(request.params);
      const student = await services.students.getById(request.user!, params.id);

      if (!student) {
        return reply.code(404).send({ message: "Student not found" });
      }

      return { student };
    },
  );

  app.patch(
    "/students/:id",
    { preHandler: [authenticate(services.auth), requirePermission("students:manage")] },
    async (request, reply) => {
      const params = routeParamsWithIdSchema.parse(request.params);
      const student = await services.students.update(
        request.user!,
        params.id,
        studentUpdateSchema.parse(request.body),
      );

      if (!student) {
        return reply.code(404).send({ message: "Student not found" });
      }

      return { student };
    },
  );

  app.delete(
    "/students/:id",
    { preHandler: [authenticate(services.auth), requirePermission("students:manage")] },
    async (request, reply) => {
      const params = routeParamsWithIdSchema.parse(request.params);
      const student = await services.students.remove(request.user!, params.id);

      if (!student) {
        return reply.code(404).send({ message: "Student not found" });
      }

      return { student };
    },
  );
}
