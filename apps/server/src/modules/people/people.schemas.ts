import { z } from "zod";

export const employeeCreateSchema = z.object({
  designation: z.string().trim().min(2).max(120),
  email: z.string().trim().email().transform((email) => email.toLowerCase()),
  hubId: z.string().uuid(),
  institutionId: z.string().uuid().nullable().optional(),
  name: z.string().trim().min(2).max(120),
  phone: z.string().trim().max(32).default(""),
  status: z.enum(["active", "invited", "suspended"]).optional(),
});

export const routeParamsWithIdSchema = z.object({
  id: z.string().uuid(),
});

export const employeeUpdateSchema = employeeCreateSchema.partial();

export type EmployeeCreateInput = z.infer<typeof employeeCreateSchema>;
export type EmployeeUpdateInput = z.infer<typeof employeeUpdateSchema>;
