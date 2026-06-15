import type { ApprovalItem, SessionUser } from "@scp/contracts";
import type { AuditService } from "../audit/audit.service.js";
import type { createGovernanceRepository } from "./governance.repository.js";
import type { ApprovalCreateInput, ApprovalDecisionInput } from "./governance.schemas.js";

export type GovernanceService = ReturnType<typeof createGovernanceService>;

export function createGovernanceService({
  audit,
  repository,
}: {
  audit: AuditService;
  repository: ReturnType<typeof createGovernanceRepository>;
}) {
  return {
    async createApproval(user: SessionUser, input: ApprovalCreateInput): Promise<ApprovalItem> {
      const approval = await repository.create({
        ...input,
        createdByUserId: user.id,
        organizationId: user.scope.organizationId,
      });

      await audit.write({
        action: "Created governance approval",
        actor: user,
        entityId: approval.id,
        entityType: "approval",
        metadata: { module: approval.module },
      });

      return approval;
    },

    listApprovals(_user: SessionUser): Promise<ApprovalItem[]> {
      return repository.list();
    },

    async decideApproval(
      user: SessionUser,
      id: string,
      input: ApprovalDecisionInput,
    ): Promise<ApprovalItem | null> {
      const approval = await repository.decide({
        ...input,
        decidedByUserId: user.id,
        id,
      });

      if (approval) {
        await audit.write({
          action: `Marked approval ${input.status}`,
          actor: user,
          entityId: approval.id,
          entityType: "approval",
          metadata: { decisionNote: input.decisionNote ?? null },
        });
      }

      return approval;
    },
  };
}

