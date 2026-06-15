import type { SessionUser } from "@scp/contracts";
import type { AuditService } from "../audit/audit.service.js";
import type { createExpertRepository } from "./experts.repository.js";
import type { ProjectFeedbackInput } from "./experts.schemas.js";

export type ExpertService = ReturnType<typeof createExpertService>;

export function createExpertService({
  audit,
  repository,
}: {
  audit: AuditService;
  repository: ReturnType<typeof createExpertRepository>;
}) {
  return {
    list: repository.list,

    listFeedback(projectId?: string) {
      return repository.listFeedback(projectId);
    },

    async createFeedback(user: SessionUser, projectId: string, input: ProjectFeedbackInput) {
      const expert = await repository.findExpertByUserId(user.id);
      const feedback = await repository.createFeedback({
        ...input,
        actorUserId: user.id,
        expertId: input.expertId ?? expert?.id ?? null,
        expertName: expert?.name ?? user.name,
        expertOrganization: expert?.organization ?? user.scope.organizationName,
        projectId,
      });

      await audit.write({
        action: "Added expert project feedback",
        actor: user,
        entityId: projectId,
        entityType: "project",
        metadata: { feedbackId: feedback.id, rating: feedback.rating },
      });

      return feedback;
    },
  };
}
