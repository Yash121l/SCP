import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Plus } from "lucide-react";
import { userHasPermission, type IncubationHub } from "@scp/contracts";
import { Badge } from "@scp/ui";
import { ActionMenu } from "../../../components/common/action-menu.js";
import { EditSheet, type EditSheetField } from "../../../components/common/edit-sheet.js";
import { HubStatusBadge } from "../../../components/common/status-badge.js";
import { ViewHeader } from "../../../components/common/view-header.js";
import { apiDelete, apiPatch } from "../../../lib/api.js";
import { useAuth } from "../../auth/auth-context.js";
import { useWorkspaceDataState } from "../../workspace/workspace-data.js";
import { useWorkspaceSummary } from "../../workspace/workspace-data.js";

function pluralizeSchool(count: number) {
  return `${count} ${count === 1 ? "school" : "schools"}`;
}

export function HubsView() {
  const { session } = useAuth();
  const { refresh } = useWorkspaceDataState();
  const { hubs } = useWorkspaceSummary();
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("");
  const [editingHub, setEditingHub] = useState<IncubationHub | null>(null);
  const canManage = session ? userHasPermission(session.user, "hubs:manage") : false;

  const editFields: EditSheetField[] = [
    { label: "Name", name: "name", required: true },
    { label: "Code", name: "code", required: true },
    { label: "Region", name: "region", required: true },
    { label: "District", name: "district", required: true },
    {
      label: "Status",
      name: "status",
      options: [
        { label: "Active", value: "active" },
        { label: "Onboarding", value: "onboarding" },
        { label: "Attention", value: "attention" },
        { label: "Archived", value: "archived" },
      ],
      required: true,
      type: "select",
    },
    { label: "Latitude", max: 90, min: -90, name: "latitude", type: "number" },
    { label: "Longitude", max: 180, min: -180, name: "longitude", type: "number" },
    { label: "Performance score", max: 100, min: 0, name: "performanceScore", type: "number" },
    { label: "Geography note", name: "geographyNote", type: "textarea" },
  ];

  async function saveHub(values: Record<string, string | number | null | undefined>) {
    if (!editingHub) {
      return;
    }
    await apiPatch(`/api/hubs/${editingHub.id}`, values, session?.token);
    setEditingHub(null);
    await refresh();
  }

  async function archiveHub(id: string, name: string) {
    if (!window.confirm(`Archive ${name}?`)) {
      return;
    }
    await apiDelete(`/api/hubs/${id}`, session?.token);
    await refresh();
  }

  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return hubs.filter((hub) => {
      const matchesQuery =
        !needle ||
        [hub.name, hub.code, hub.region, hub.district].some((value) => value.toLowerCase().includes(needle));
      const matchesStatus = !status || hub.status === status;
      return matchesQuery && matchesStatus;
    });
  }, [hubs, query, status]);

  return (
    <div className="workspace-scroll">
      <ViewHeader
        title="Incubators"
        description="Network anchors for school clusters, employees and student activity."
        action={
          canManage && (
            <Link className="ui-button ui-button-primary ui-button-md" to="/workspace/hubs/new">
              <Plus size={16} />
              Add incubator
            </Link>
          )
        }
      />

      <div className="index-toolbar">
        <input
          aria-label="Search incubators"
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Search incubators..."
          value={query}
        />
        <select aria-label="Filter incubators by status" onChange={(event) => setStatus(event.target.value)} value={status}>
          <option value="">All Status</option>
          <option value="active">Active</option>
          <option value="onboarding">Onboarding</option>
          <option value="attention">Attention</option>
          <option value="archived">Archived</option>
        </select>
        <span>{filtered.length} of {hubs.length}</span>
      </div>

      <div className="index-table-card">
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Incubator</th>
                <th>Region</th>
                <th>District</th>
                <th>Schools</th>
                <th>Employees</th>
                <th>Students</th>
                <th>Status</th>
                {canManage && <th>Actions</th>}
              </tr>
            </thead>
            <tbody>
              {filtered.map((hub) => (
                <tr key={hub.id}>
                  <td data-label="Incubator">
                    <Link className="table-identity" to={`/workspace/hubs/${hub.id}`}>
                      <span>{hub.name.charAt(0)}</span>
                      <strong>{hub.name}</strong>
                      <small>{hub.code}</small>
                    </Link>
                  </td>
                  <td data-label="Region">{hub.region}</td>
                  <td data-label="District">{hub.district}</td>
                  <td data-label="Schools">{pluralizeSchool(hub.institutionCount)}</td>
                  <td data-label="Employees">{hub.employeeCount}</td>
                  <td data-label="Students">{hub.studentCount.toLocaleString("en-IN")}</td>
                  <td data-label="Status">
                    <HubStatusBadge status={hub.status} />
                  </td>
                  {canManage && (
                    <td data-label="Actions">
                      <ActionMenu
                        canDelete
                        canEdit
                        deleteLabel="Archive incubator"
                        onDelete={() => void archiveHub(hub.id, hub.name)}
                        onEdit={() => setEditingHub(hub)}
                      />
                    </td>
                  )}
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td className="empty-table-cell" colSpan={canManage ? 8 : 7} data-label="Empty">
                    <Badge>No incubators match your filters</Badge>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
      {editingHub && (
        <EditSheet
          description="Update incubator ownership, geography and operational status."
          fields={editFields}
          initialValues={editingHub}
          onClose={() => setEditingHub(null)}
          onSubmit={saveHub}
          title={`Edit ${editingHub.name}`}
        />
      )}
    </div>
  );
}
