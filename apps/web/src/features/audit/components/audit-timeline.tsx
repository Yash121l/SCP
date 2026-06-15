import { FileClock } from "lucide-react";
import type { AuditEntry } from "@scp/contracts";
import { formatDate } from "../../../lib/format.js";

export function AuditTimeline({ audit }: { audit: AuditEntry[] }) {
  return (
    <div className="audit-list">
      {audit.map((entry) => (
        <div className="audit-row" key={entry.id}>
          <FileClock size={16} />
          <div>
            <strong>{entry.action}</strong>
            <span>
              {entry.actor} · {entry.entityType} · {formatDate(entry.createdAt)}
            </span>
          </div>
        </div>
      ))}
    </div>
  );
}

