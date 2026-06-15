import { z } from "zod";

export const routeParamsWithIdSchema = z.object({
  id: z.string().uuid(),
});

export const studentCreateSchema = z.object({
  email: z.string().trim().email().transform((email) => email.toLowerCase()),
  grade: z.string().trim().min(1).max(80),
  institutionId: z.string().uuid(),
  mentorEmployeeId: z.string().uuid().nullable().optional(),
  name: z.string().trim().min(2).max(120),
  projectCount: z.number().int().min(0).max(1000).optional(),
  status: z.enum(["active", "paused", "graduated"]).optional(),
});

export const studentUpdateSchema = studentCreateSchema.partial();

export type StudentCreateInput = z.infer<typeof studentCreateSchema>;
export type StudentUpdateInput = z.infer<typeof studentUpdateSchema>;
