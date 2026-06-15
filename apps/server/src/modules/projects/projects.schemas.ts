import { z } from "zod";

export const routeParamsWithIdSchema = z.object({
  id: z.string().uuid(),
});

export const projectStatusSchema = z.enum([
  "proposed",
  "under_review",
  "approved",
  "in_progress",
  "on_hold",
  "completed",
  "rejected",
]);

export const projectCreateSchema = z.object({
  domain: z.string().trim().min(2).max(120),
  institutionId: z.string().uuid().optional(),
  ownerEmail: z.string().trim().email().optional(),
  ownerName: z.string().trim().min(2).max(120).optional(),
  problemStatement: z.string().trim().min(10).max(1200),
  solutionSummary: z.string().trim().min(10).max(1200),
  studentId: z.string().uuid().nullable().optional(),
  title: z.string().trim().min(3).max(160),
});

export const projectStatusUpdateSchema = z.object({
  reviewNote: z.string().trim().max(1000).optional(),
  status: projectStatusSchema,
});

export const projectUpdateSchema = projectCreateSchema.partial().extend({
  reviewNote: z.string().trim().max(1000).nullable().optional(),
  status: projectStatusSchema.optional(),
});

export type ProjectCreateInput = z.infer<typeof projectCreateSchema>;
export type ProjectStatusUpdateInput = z.infer<typeof projectStatusUpdateSchema>;
export type ProjectUpdateInput = z.infer<typeof projectUpdateSchema>;
