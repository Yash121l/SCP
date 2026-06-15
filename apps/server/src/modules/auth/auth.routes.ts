import type { FastifyInstance } from "fastify";
import type { Services } from "../../services.js";
import { authenticate } from "../../security/authenticate.js";
import { loginSchema } from "./auth.schemas.js";

export async function registerAuthRoutes(app: FastifyInstance, services: Services) {
  app.post("/auth/login", async (request, reply) => {
    const input = loginSchema.parse(request.body);
    const result = await services.auth.login(input);

    reply.setCookie("scp_session", result.token, services.auth.sessionCookieOptions);
    return result;
  });

  app.post("/auth/logout", async (_request, reply) => {
    reply.clearCookie("scp_session", services.auth.sessionCookieOptions);
    return { ok: true };
  });

  app.get("/auth/me", { preHandler: [authenticate(services.auth)] }, async (request) => ({
    user: request.user,
  }));
}
