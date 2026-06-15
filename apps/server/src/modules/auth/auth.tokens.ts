import type { SessionUser } from "@scp/contracts";
import { sessionUserSchema } from "@scp/contracts";
import { SignJWT, jwtVerify } from "jose";

export type AuthTokens = ReturnType<typeof createAuthTokens>;

export function createAuthTokens(secret: string) {
  const jwtSecret = new TextEncoder().encode(secret);

  return {
    async sign(user: SessionUser): Promise<string> {
      return new SignJWT({ user })
        .setProtectedHeader({ alg: "HS256" })
        .setSubject(user.id)
        .setIssuedAt()
        .setExpirationTime("8h")
        .sign(jwtSecret);
    },

    async verify(token: string): Promise<SessionUser> {
      const { payload } = await jwtVerify(token, jwtSecret);
      return sessionUserSchema.parse(payload.user);
    },
  };
}

