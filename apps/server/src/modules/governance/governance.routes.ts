import type { FastifyInstance } from "fastify";
import type { Services } from "../../services.js";
import { authenticate, requirePermission } from "../../security/authenticate.js";
import {
  approvalCreateSchema,
  approvalDecisionSchema,
  routeParamsWithIdSchema,
} from "./governance.schemas.js";

export async function registerGovernanceRoutes(app: FastifyInstance, services: Services) {
  app.get(
    "/governance/approvals",
    { preHandler: [authenticate(services.auth), requirePermission("governance:read")] },
    async (request) => ({
      approvals: await services.governance.listApprovals(request.user!),
    }),
  );

  app.post(
    "/governance/approvals",
    { preHandler: [authenticate(services.auth), requirePermission("governance:manage")] },
    async (request, reply) => {
      const approval = await services.governance.createApproval(
        request.user!,
        approvalCreateSchema.parse(request.body),
      );
      return reply.code(201).send({ approval });
    },
  );

  app.patch(
    "/governance/approvals/:id/decision",
    { preHandler: [authenticate(services.auth), requirePermission("approvals:review")] },
    async (request, reply) => {
      const params = routeParamsWithIdSchema.parse(request.params);
      const approval = await services.governance.decideApproval(
        request.user!,
        params.id,
        approvalDecisionSchema.parse(request.body),
      );

      if (!approval) {
        return reply.code(404).send({ message: "Pending approval not found" });
      }

      return { approval };
    },
  );
}

