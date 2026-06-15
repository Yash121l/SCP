import { Link } from "react-router-dom";
import type { Institution } from "@scp/contracts";
import { ActionMenu } from "../../../components/common/action-menu.js";
import { InstitutionStatusBadge } from "../../../components/common/status-badge.js";

export function InstitutionsTable({
  canManage,
  institutions,
  onArchive,
  onEdit,
}: {
  canManage?: boolean;
  institutions: Institution[];
  onArchive?: (institution: Institution) => void;
  onEdit?: (institution: Institution) => void;
}) {
  return (
    <div className="table-wrap">
      <table>
        <thead>
          <tr>
            <th>Name</th>
            <th>Incubator</th>
            <th>Region</th>
            <th>Employees</th>
            <th>Students</th>
            <th>Projects</th>
            <th>Status</th>
            {canManage && <th>Actions</th>}
          </tr>
        </thead>
        <tbody>
          {institutions.map((institution) => (
            <tr key={institution.id}>
              <td data-label="Name">
                <Link className="table-identity" to={`/workspace/institutions/${institution.id}`}>
                  <span>{institution.name.charAt(0)}</span>
                  <strong>{institution.name}</strong>
                  <small>{institution.code}</small>
                </Link>
              </td>
              <td data-label="Incubator">{institution.hubName}</td>
              <td data-label="Region">{institution.region}</td>
              <td data-label="Employees">{institution.employeeCount}</td>
              <td data-label="Students">{institution.studentCount.toLocaleString("en-IN")}</td>
              <td data-label="Projects">{institution.projectCount}</td>
              <td data-label="Status">
                <InstitutionStatusBadge status={institution.status} />
              </td>
              {canManage && (
                <td data-label="Actions">
                  <ActionMenu
                    canDelete
                    canEdit
                    deleteLabel="Archive school"
                    onDelete={() => onArchive?.(institution)}
                    onEdit={() => onEdit?.(institution)}
                  />
                </td>
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
