import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Plus } from "lucide-react";
import { userHasPermission, type Institution } from "@scp/contracts";
import { EditSheet, type EditSheetField } from "../../../components/common/edit-sheet.js";
import { ViewHeader } from "../../../components/common/view-header.js";
import { apiDelete, apiPatch } from "../../../lib/api.js";
import { useAuth } from "../../auth/auth-context.js";
import { useWorkspaceDataState, useWorkspaceSummary } from "../../workspace/workspace-data.js";
import { InstitutionsTable } from "./institutions-table.js";

export function InstitutionsView() {
  const { session } = useAuth();
  const { refresh } = useWorkspaceDataState();
  const { hubs, institutions } = useWorkspaceSummary();
  const [query, setQuery] = useState("");
  const [hubId, setHubId] = useState("");
  const [status, setStatus] = useState("");
  const [editingInstitution, setEditingInstitution] = useState<Institution | null>(null);
  const canManage = session ? userHasPermission(session.user, "institutions:manage") : false;

  const editFields: EditSheetField[] = [
    { label: "School name", name: "name", required: true },
    { label: "Code", name: "code" },
    {
      label: "Incubator",
      name: "hubId",
      options: hubs.map((hub) => ({ label: hub.name, value: hub.id })),
      required: true,
      type: "select",
    },
    {
      label: "Type",
      name: "type",
      options: [
        { label: "School", value: "school" },
        { label: "College", value: "college" },
        { label: "Polytechnic", value: "polytechnic" },
        { label: "ITI", value: "iti" },
      ],
      required: true,
      type: "select",
    },
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
    { label: "Region", name: "region", required: true },
    { label: "District", name: "district", required: true },
    { label: "Address", name: "address", type: "address" },
    { label: "Principal", name: "principalName", required: true },
    { label: "Contact email", name: "contactEmail", required: true, type: "email" },
    { label: "Map Coordinates", name: "location", type: "location" },
    { label: "Performance score", max: 100, min: 0, name: "performanceScore", type: "number" },
    { label: "Students", min: 0, name: "studentCount", type: "number" },
    { label: "Projects", min: 0, name: "projectCount", type: "number" },
    { label: "Geography note", name: "geographyNote", type: "textarea" },
  ];

  async function saveInstitution(values: Record<string, string | number | null | undefined>) {
    if (!editingInstitution) {
      return;
    }
    await apiPatch(`/api/institutions/${editingInstitution.id}`, values, session?.token);
    setEditingInstitution(null);
    await refresh();
  }

  async function archiveInstitution(institution: Institution) {
    if (!window.confirm(`Archive ${institution.name}?`)) {
      return;
    }
    await apiDelete(`/api/institutions/${institution.id}`, session?.token);
    await refresh();
  }
  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return institutions.filter((institution) => {
      const matchesQuery =
        !needle ||
        [institution.name, institution.code, institution.hubName, institution.region, institution.district].some((value) =>
          value.toLowerCase().includes(needle),
        );
      const matchesHub = !hubId || institution.hubId === hubId;
      const matchesStatus = !status || institution.status === status;
      return matchesQuery && matchesHub && matchesStatus;
    });
  }, [hubId, institutions, query, status]);

  return (
    <div className="workspace-scroll">
      <ViewHeader
        title="Schools"
        description="Mapped schools, champions, student volume and cluster status."
        action={
          canManage && (
            <Link className="ui-button ui-button-primary ui-button-md" to="/workspace/institutions/new">
              <Plus size={16} />
              Add school
            </Link>
          )
        }
      />

      <div className="index-toolbar">
        <input
          aria-label="Search schools"
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Search schools..."
          value={query}
        />
        <select aria-label="Filter schools by incubator" onChange={(event) => setHubId(event.target.value)} value={hubId}>
          <option value="">All Incubators</option>
          {hubs.map((hub) => (
            <option key={hub.id} value={hub.id}>
              {hub.name}
            </option>
          ))}
        </select>
        <select aria-label="Filter schools by status" onChange={(event) => setStatus(event.target.value)} value={status}>
          <option value="">All Status</option>
          <option value="active">Active</option>
          <option value="onboarding">Onboarding</option>
          <option value="attention">Attention</option>
          <option value="archived">Archived</option>
        </select>
        <span>{filtered.length} of {institutions.length}</span>
      </div>

      <div className="index-table-card">
        <InstitutionsTable
          canManage={canManage}
          institutions={filtered}
          onArchive={(institution) => void archiveInstitution(institution)}
          onEdit={(institution) => setEditingInstitution(institution)}
        />
      </div>
      {editingInstitution && (
        <EditSheet
          description="Update school placement, leadership, coordinates and programme metrics."
          fields={editFields}
          initialValues={editingInstitution}
          onClose={() => setEditingInstitution(null)}
          onSubmit={saveInstitution}
          title={`Edit ${editingInstitution.name}`}
        />
      )}
    </div>
  );
}
