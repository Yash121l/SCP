import { z } from "zod";

export const routeParamsWithIdSchema = z.object({
  id: z.string().uuid(),
});

export const institutionCreateSchema = z.object({
  address: z.string().trim().min(3).max(240).default("Address pending"),
  code: z
    .string()
    .trim()
    .regex(/^[A-Z0-9-]+$/)
    .min(3)
    .max(32)
    .optional(),
  contactEmail: z.string().trim().email().transform((email) => email.toLowerCase()),
  district: z.string().trim().min(2).max(120),
  employeeCount: z.number().int().min(0).max(10000).optional(),
  geographyNote: z.string().trim().min(2).max(240).optional(),
  hubId: z.string().uuid(),
  latitude: z.number().min(-90).max(90).optional(),
  longitude: z.number().min(-180).max(180).optional(),
  name: z.string().trim().min(3).max(160),
  organizationSlug: z
    .string()
    .trim()
    .regex(/^[a-z0-9-]+$/)
    .max(64)
    .optional(),
  projectCount: z.number().int().min(0).max(100000).optional(),
  performanceScore: z.number().int().min(0).max(100).optional(),
  principalName: z.string().trim().min(2).max(120).default("Principal pending"),
  region: z.string().trim().min(2).max(120),
  status: z.enum(["active", "onboarding", "attention"]).optional(),
  studentCount: z.number().int().min(0).max(1000000).optional(),
  type: z.enum(["school", "college", "polytechnic", "iti"]),
});

export const institutionStatusSchema = z.object({
  status: z.enum(["active", "onboarding", "attention", "archived"]),
});

export const institutionUpdateSchema = institutionCreateSchema.partial().extend({
  status: z.enum(["active", "onboarding", "attention", "archived"]).optional(),
});

export type InstitutionCreateInput = z.infer<typeof institutionCreateSchema>;
export type InstitutionStatusInput = z.infer<typeof institutionStatusSchema>;
export type InstitutionUpdateInput = z.infer<typeof institutionUpdateSchema>;
