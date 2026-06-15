import cookie from "@fastify/cookie";
import cors from "@fastify/cors";
import helmet from "@fastify/helmet";
import rateLimit from "@fastify/rate-limit";
import { createDatabase } from "@scp/database";
import Fastify from "fastify";
import { env, isProduction } from "./config/env.js";
import { registerErrorHandler } from "./http/error-handler.js";
import { registerRoutes } from "./http/register-routes.js";
import { createServices } from "./services.js";

export async function buildServer() {
  const database = createDatabase(env.DATABASE_URL);
  const app = Fastify({
    logger: env.NODE_ENV !== "test",
  });

  app.addHook("onClose", async () => {
    await database.pool.end();
  });

  await app.register(cookie, {
    secret: env.COOKIE_SECRET,
  });

  await app.register(helmet, {
    contentSecurityPolicy: false,
  });

  await app.register(cors, {
    credentials: true,
    origin: Array.from(
      new Set([
        env.FRONTEND_ORIGIN,
        "http://localhost:5173",
        "http://127.0.0.1:5173",
      ]),
    ),
  });

  await app.register(rateLimit, {
    max: 120,
    timeWindow: "1 minute",
  });

  const services = createServices(database.db, {
    sessionCookieOptions: {
      httpOnly: true,
      path: "/",
      sameSite: "lax",
      secure: isProduction,
    },
  });

  registerErrorHandler(app);
  await registerRoutes(app, services);

  return { app, database, services };
}
