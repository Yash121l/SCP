import { z } from "zod";

export const routeParamsWithIdSchema = z.object({
  id: z.string().uuid(),
});

export const approvalCreateSchema = z.object({
  assignedRole: z.string().trim().min(2).max(80),
  dueAt: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/)
    .refine((date) => new Date(`${date}T00:00:00Z`).getTime() >= Date.now() - 86400000, {
      message: "Due date cannot be in the past",
    }),
  module: z.string().trim().min(2).max(80),
  owner: z.string().trim().min(2).max(120),
  title: z.string().trim().min(4).max(180),
});

export const approvalDecisionSchema = z.object({
  decisionNote: z.string().trim().max(1000).optional(),
  status: z.enum(["approved", "returned", "rejected"]),
});

export type ApprovalCreateInput = z.infer<typeof approvalCreateSchema>;
export type ApprovalDecisionInput = z.infer<typeof approvalDecisionSchema>;

