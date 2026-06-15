import { userHasPermission, type ApprovalItem } from "@scp/contracts";
import { Badge, Panel } from "@scp/ui";
import { ViewHeader } from "../../../components/common/view-header.js";
import { apiPatch } from "../../../lib/api.js";
import { useAuth } from "../../auth/auth-context.js";
import { useWorkspaceDataState, useWorkspaceSummary } from "../../workspace/workspace-data.js";
import { ApprovalsTable } from "./approvals-table.js";

export function GovernanceView() {
  const { session } = useAuth();
  const { refresh } = useWorkspaceDataState();
  const { approvals } = useWorkspaceSummary();
  const canReview = session ? userHasPermission(session.user, "approvals:review") : false;

  async function decide(approval: ApprovalItem, status: "approved" | "returned") {
    await apiPatch(
      `/api/governance/approvals/${approval.id}/decision`,
      {
        decisionNote: status === "approved" ? "Approved from governance queue." : "Returned for correction.",
        status,
      },
      session?.token,
    );
    await refresh();
  }

  return (
    <div className="workspace-scroll">
      <ViewHeader
        eyebrow="Governance workflow"
        title="Approvals and decisions"
        action={<Badge tone="blue">{approvals.filter((approval) => approval.status === "pending").length} pending</Badge>}
      />
      <Panel title="Maker-checker queue">
        <ApprovalsTable
          approvals={approvals}
          onApprove={canReview ? (approval) => void decide(approval, "approved") : undefined}
          onReturn={canReview ? (approval) => void decide(approval, "returned") : undefined}
        />
      </Panel>
    </div>
  );
}
