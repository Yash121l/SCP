import { Link } from "react-router-dom";
import type { IncubationHub } from "@scp/contracts";
import { HubStatusBadge } from "../../../components/common/status-badge.js";

function pluralizeSchool(count: number) {
  return `${count} ${count === 1 ? "school" : "schools"}`;
}

export function HubFocusList({ hubs }: { hubs: IncubationHub[] }) {
  return (
    <div className="institution-list">
      {hubs.map((hub) => (
        <Link className="institution-row" key={hub.id} to={`/workspace/hubs/${hub.id}`}>
          <div>
            <strong>{hub.name}</strong>
            <span>
              {hub.region} · {pluralizeSchool(hub.institutionCount)} · {hub.studentCount} students
            </span>
          </div>
          <HubStatusBadge status={hub.status} />
        </Link>
      ))}
    </div>
  );
}
