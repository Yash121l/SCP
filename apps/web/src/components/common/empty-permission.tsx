import { LockKeyhole } from "lucide-react";
import { Panel } from "@scp/ui";

export function EmptyPermission({ permission }: { permission: string }) {
  return (
    <div className="workspace-scroll">
      <Panel>
        <div className="empty-permission">
          <LockKeyhole size={28} />
          <strong>Restricted workspace</strong>
          <span>Your current role does not include `{permission}`.</span>
        </div>
      </Panel>
    </div>
  );
}

