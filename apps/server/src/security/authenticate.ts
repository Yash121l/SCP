import type { FastifyReply, FastifyRequest } from "fastify";
import type { Permission, SessionUser } from "@scp/contracts";
import { userHasPermission } from "@scp/contracts";
import type { AuthService } from "../modules/auth/auth.service.js";

declare module "fastify" {
  interface FastifyRequest {
    user?: SessionUser;
  }
}

function tokenFromRequest(request: FastifyRequest): string | null {
  const bearer = request.headers.authorization;
  if (bearer?.startsWith("Bearer ")) {
    return bearer.slice("Bearer ".length);
  }

  return request.cookies.scp_session ?? null;
}

export function authenticate(auth: AuthService) {
  return async (request: FastifyRequest, reply: FastifyReply) => {
    const token = tokenFromRequest(request);

    if (!token) {
      return reply.code(401).send({ message: "Authentication required" });
    }

    try {
      request.user = await auth.verify(token);
    } catch {
      return reply.code(401).send({ message: "Invalid or expired session" });
    }
  };
}

export function requirePermission(permission: Permission) {
  return async (request: FastifyRequest, reply: FastifyReply) => {
    if (!request.user) {
      return reply.code(401).send({ message: "Authentication required" });
    }

    if (!userHasPermission(request.user, permission)) {
      return reply.code(403).send({ message: `Missing permission: ${permission}` });
    }
  };
}

