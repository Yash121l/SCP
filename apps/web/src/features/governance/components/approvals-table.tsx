import type { ApprovalItem } from "@scp/contracts";
import { Button } from "@scp/ui";
import { ApprovalStatusBadge } from "../../../components/common/status-badge.js";
import { formatDate } from "../../../lib/format.js";

export function ApprovalsTable({
  approvals,
  onApprove,
  onReturn,
}: {
  approvals: ApprovalItem[];
  onApprove?: (approval: ApprovalItem) => void;
  onReturn?: (approval: ApprovalItem) => void;
}) {
  const canAct = Boolean(onApprove || onReturn);

  return (
    <div className="table-wrap">
      <table>
        <thead>
          <tr>
            <th>Item</th>
            <th>Module</th>
            <th>Owner</th>
            <th>Status</th>
            <th>Due</th>
            {canAct && <th>Action</th>}
          </tr>
        </thead>
        <tbody>
          {approvals.map((approval) => (
            <tr key={approval.id}>
              <td data-label="Item">{approval.title}</td>
              <td data-label="Module">{approval.module}</td>
              <td data-label="Owner">{approval.owner}</td>
              <td data-label="Status">
                <ApprovalStatusBadge status={approval.status} />
              </td>
              <td data-label="Due">{formatDate(approval.dueAt)}</td>
              {canAct && (
                <td data-label="Action">
                  <div className="row-actions">
                    <Button
                      disabled={approval.status !== "pending"}
                      onClick={() => onApprove?.(approval)}
                      size="sm"
                      variant="primary"
                    >
                      Approve
                    </Button>
                    <Button
                      disabled={approval.status !== "pending"}
                      onClick={() => onReturn?.(approval)}
                      size="sm"
                    >
                      Return
                    </Button>
                  </div>
                </td>
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
