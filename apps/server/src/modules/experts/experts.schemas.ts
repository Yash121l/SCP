import { z } from "zod";

export const routeParamsWithIdSchema = z.object({
  id: z.string().uuid(),
});

export const projectFeedbackSchema = z.object({
  expertId: z.string().uuid().nullable().optional(),
  note: z.string().trim().min(8).max(1200),
  rating: z.number().int().min(1).max(5),
});

export type ProjectFeedbackInput = z.infer<typeof projectFeedbackSchema>;
