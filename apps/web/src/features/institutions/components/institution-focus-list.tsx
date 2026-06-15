import { Link } from "react-router-dom";
import type { Institution } from "@scp/contracts";
import { InstitutionStatusBadge } from "../../../components/common/status-badge.js";

export function InstitutionFocusList({ institutions }: { institutions: Institution[] }) {
  return (
    <div className="institution-list">
      {institutions.map((institution) => (
        <Link className="institution-row" key={institution.id} to={`/workspace/institutions/${institution.id}`}>
          <div>
            <strong>{institution.name}</strong>
            <span>
              {institution.hubName} · {institution.region}
            </span>
          </div>
          <InstitutionStatusBadge status={institution.status} />
        </Link>
      ))}
    </div>
  );
}
