import type { CookieSerializeOptions } from "@fastify/cookie";
import type { ProgrammeRole, SessionUser } from "@scp/contracts";
import { programmeRoles } from "@scp/contracts";
import bcrypt from "bcryptjs";
import type { AuthTokens } from "./auth.tokens.js";
import type { LoginInput } from "./auth.schemas.js";
import type { createAuthRepository } from "./auth.repository.js";

export type AuthService = ReturnType<typeof createAuthService>;

export function createAuthService({
  repository,
  sessionCookieOptions,
  tokens,
}: {
  repository: ReturnType<typeof createAuthRepository>;
  sessionCookieOptions: CookieSerializeOptions;
  tokens: AuthTokens;
}) {
  return {
    sessionCookieOptions,

    async login(input: LoginInput): Promise<{ token: string; user: SessionUser }> {
      const record = await repository.findActiveUserByEmail(input.email);

      if (!record || !(await bcrypt.compare(input.password, record.passwordHash))) {
        const error = new Error("Invalid credentials");
        Object.assign(error, { statusCode: 401, code: "INVALID_CREDENTIALS" });
        throw error;
      }

      const roles = record.roles
        .map((role) => role.role)
        .filter((role): role is ProgrammeRole => programmeRoles.includes(role as ProgrammeRole));

      const activeScope = record.roles[0];
      const user: SessionUser = {
        email: record.email,
        id: record.id,
        name: record.name,
        roles,
        scope: {
          hubId: activeScope?.hubId ?? null,
          institutionId: activeScope?.institutionId ?? null,
          organizationId: activeScope?.organizationId ?? null,
          organizationName: activeScope?.organizationName ?? "Unscoped",
          organizationType: activeScope?.organizationType ?? "global",
          studentId: record.studentId,
        },
      };

      return {
        token: await tokens.sign(user),
        user,
      };
    },

    verify(token: string): Promise<SessionUser> {
      return tokens.verify(token);
    },
  };
}
