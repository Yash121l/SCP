import "dotenv/config";
import { z } from "zod";

const envSchema = z.object({
  COOKIE_SECRET: z
    .string()
    .min(32)
    .default("dev-cookie-secret-for-scp-portal-change-me"),
  DATABASE_URL: z.string().url().default("postgres://scp:scp@localhost:5432/scp_portal"),
  FRONTEND_ORIGIN: z.string().url().default("http://localhost:5173"),
  JWT_SECRET: z
    .string()
    .min(32)
    .default("dev-jwt-secret-for-scp-portal-change-me-now"),
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  PORT: z.coerce.number().int().positive().default(4000),
});

export const env = envSchema.parse(process.env);

export const isProduction = env.NODE_ENV === "production";

