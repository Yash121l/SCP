import { LockKeyhole, ShieldCheck } from "lucide-react";
import type { Permission, SessionUser } from "@scp/contracts";
import { roleLabels, userHasPermission } from "@scp/contracts";
import { Badge, Panel } from "@scp/ui";

const posturePermissions = [
  "dashboard:read",
  "hubs:read",
  "institutions:manage",
  "projects:manage",
  "students:manage",
  "governance:manage",
  "audit:read",
] satisfies Permission[];

export function AccessPosture({ canReadAudit, user }: { canReadAudit: boolean; user: SessionUser }) {
  const permissionCount = posturePermissions.filter((permission) =>
    userHasPermission(user, permission),
  ).length;

  return (
    <Panel
      title="Access posture"
      action={<Badge tone="blue">{permissionCount}/{posturePermissions.length} controls</Badge>}
      className="span-5"
    >
      <div className="access-list">
        {user.roles.map((role) => (
          <div key={role} className="access-row">
            <ShieldCheck size={16} />
            <span>{roleLabels[role]}</span>
            <Badge tone="green">Granted</Badge>
          </div>
        ))}
        <div className="access-row muted">
          <LockKeyhole size={16} />
          <span>Audit log visibility</span>
          <Badge tone={canReadAudit ? "green" : "amber"}>
            {canReadAudit ? "Allowed" : "Restricted"}
          </Badge>
        </div>
      </div>
    </Panel>
  );
}
