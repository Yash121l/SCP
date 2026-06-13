import { useState } from "react";
import { CheckCircle2, Loader2 } from "lucide-react";
import { Badge, Button } from "@scp/ui";
import type { Approval, Role } from "../../../types";
import { statusVariant } from "../../../lib/status";

export function ApprovalList({
  approvals,
  onApprove,
  role,
}: {
  approvals: Approval[];
  onApprove?: (id: string) => Promise<void>;
  role: Role;
}) {
  const [pending, setPending] = useState<string | null>(null);
  const canApprove = role.permissions.includes("approve");

  if (approvals.length === 0) {
    return (
      <div className="grid min-h-28 place-items-center rounded-lg border border-dashed text-sm text-muted-foreground">
        No open approval items for this role.
      </div>
    );
  }

  return (
    <div className="grid gap-3">
      {approvals.map((item) => (
        <div
          className="flex flex-col gap-3 rounded-lg border bg-muted/20 p-3 sm:flex-row sm:items-center sm:justify-between"
          key={item.id}
        >
          <div>
            <strong className="block">{item.title}</strong>
            <span className="text-sm text-muted-foreground">
              {item.module} · {item.owner} · {item.age}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant={statusVariant(item.priority)}>{item.priority}</Badge>
            {onApprove && canApprove ? (
              <Button
                disabled={pending === item.id}
                onClick={() => {
                  setPending(item.id);
                  onApprove(item.id).finally(() => setPending(null));
                }}
                size="sm"
              >
                {pending === item.id ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <CheckCircle2 className="h-3.5 w-3.5" />
                )}
                Approve
              </Button>
            ) : null}
          </div>
        </div>
      ))}
    </div>
  );
}
