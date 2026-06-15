import { FileClock } from "lucide-react";
import { Button, Panel } from "@scp/ui";
import { ViewHeader } from "../../../components/common/view-header.js";
import { useWorkspaceSummary } from "../../workspace/workspace-data.js";
import { IndicatorList } from "./indicator-list.js";

export function ReportsView() {
  const { indicators } = useWorkspaceSummary();

  return (
    <div className="workspace-scroll">
      <ViewHeader
        eyebrow="Monitoring and reporting"
        title="Launch indicators"
        action={
          <Button>
            <FileClock size={16} />
            Export request
          </Button>
        }
      />
      <Panel>
        <IndicatorList indicators={indicators} />
      </Panel>
    </div>
  );
}

