import { z } from "zod";
import { roleSchema } from "./rbac.js";

export const sessionUserSchema = z.object({
  id: z.string().uuid(),
  email: z.string().email(),
  name: z.string(),
  roles: z.array(roleSchema),
  scope: z.object({
    organizationId: z.string().uuid().nullable(),
    organizationName: z.string(),
    organizationType: z.string(),
    hubId: z.string().uuid().nullable().optional(),
    institutionId: z.string().uuid().nullable().optional(),
    studentId: z.string().uuid().nullable().optional(),
  }),
});

export type SessionUser = z.infer<typeof sessionUserSchema>;

export const loginResponseSchema = z.object({
  token: z.string().optional(),
  user: sessionUserSchema,
});

export type LoginResponse = z.infer<typeof loginResponseSchema>;
