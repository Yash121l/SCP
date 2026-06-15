import { z } from "zod";

export const curriculumDeliveryStatusSchema = z.enum(["planned", "active", "at_risk", "completed"]);
export const curriculumLearnerStatusSchema = z.enum(["not_started", "in_progress", "completed"]);

export const routeParamsWithIdSchema = z.object({
  id: z.string().uuid(),
});

export const curriculumAssignmentUpdateSchema = z
  .object({
    completedSessions: z.number().int().min(0).optional(),
    nextTopic: z.string().trim().min(2).max(240).optional(),
    ownerEmployeeId: z.string().uuid().nullable().optional(),
    plannedSessions: z.number().int().min(0).optional(),
    status: curriculumDeliveryStatusSchema.optional(),
  })
  .refine(
    (input) =>
      input.completedSessions === undefined ||
      input.plannedSessions === undefined ||
      input.completedSessions <= input.plannedSessions,
    "Completed sessions cannot exceed planned sessions",
  );

export const curriculumStageUpdateSchema = z
  .object({
    completedSessions: z.number().int().min(0).optional(),
    nextTopic: z.string().trim().min(2).max(240).optional(),
    plannedSessions: z.number().int().min(0).optional(),
    status: curriculumDeliveryStatusSchema.optional(),
    title: z.string().trim().min(2).max(160).optional(),
  })
  .refine(
    (input) =>
      input.completedSessions === undefined ||
      input.plannedSessions === undefined ||
      input.completedSessions <= input.plannedSessions,
    "Completed sessions cannot exceed planned sessions",
  );

export const curriculumLearnerUpdateSchema = z.object({
  evidenceNote: z.string().trim().max(500).optional(),
  projectId: z.string().uuid().nullable().optional(),
  status: curriculumLearnerStatusSchema.optional(),
});

export type CurriculumAssignmentUpdateInput = z.infer<typeof curriculumAssignmentUpdateSchema>;
export type CurriculumStageUpdateInput = z.infer<typeof curriculumStageUpdateSchema>;
export type CurriculumLearnerUpdateInput = z.infer<typeof curriculumLearnerUpdateSchema>;
