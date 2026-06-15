import { z } from "zod";

export const routeParamsWithIdSchema = z.object({
  id: z.string().uuid(),
});

export const hubCreateSchema = z.object({
  code: z
    .string()
    .trim()
    .regex(/^[A-Z0-9-]+$/)
    .min(3)
    .max(32),
  district: z.string().trim().min(2).max(120),
  geographyNote: z.string().trim().min(2).max(240).optional(),
  latitude: z.number().min(-90).max(90).optional(),
  longitude: z.number().min(-180).max(180).optional(),
  name: z.string().trim().min(3).max(160),
  performanceScore: z.number().int().min(0).max(100).optional(),
  region: z.string().trim().min(2).max(120),
  status: z.enum(["active", "onboarding", "attention"]).optional(),
});

export type HubCreateInput = z.infer<typeof hubCreateSchema>;
export const hubUpdateSchema = hubCreateSchema.partial().extend({
  status: z.enum(["active", "onboarding", "attention", "archived"]).optional(),
});
export type HubUpdateInput = z.infer<typeof hubUpdateSchema>;
