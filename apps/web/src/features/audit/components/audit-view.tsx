import { userHasPermission } from "@scp/contracts";
import { Panel } from "@scp/ui";
import { EmptyPermission } from "../../../components/common/empty-permission.js";
import { ViewHeader } from "../../../components/common/view-header.js";
import { useAuth } from "../../auth/auth-context.js";
import { useWorkspaceSummary } from "../../workspace/workspace-data.js";
import { AuditTimeline } from "./audit-timeline.js";

export function AuditView() {
  const { session } = useAuth();
  const { audit } = useWorkspaceSummary();

  if (!session || !userHasPermission(session.user, "audit:read")) {
    return <EmptyPermission permission="audit:read" />;
  }

  return (
    <div className="workspace-scroll">
      <ViewHeader eyebrow="Evidence trail" title="Audit log" />
      <Panel>
        <AuditTimeline audit={audit} />
      </Panel>
    </div>
  );
}

