import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Plus } from "lucide-react";
import { userHasPermission, type HubEmployee } from "@scp/contracts";
import { ActionMenu } from "../../../components/common/action-menu.js";
import { EditSheet, type EditSheetField } from "../../../components/common/edit-sheet.js";
import { ViewHeader } from "../../../components/common/view-header.js";
import { apiDelete, apiPatch } from "../../../lib/api.js";
import { useAuth } from "../../auth/auth-context.js";
import { useWorkspaceDataState, useWorkspaceSummary } from "../../workspace/workspace-data.js";

export function PeopleView() {
  const { session } = useAuth();
  const { refresh } = useWorkspaceDataState();
  const { employees, hubs, institutions } = useWorkspaceSummary();
  const [query, setQuery] = useState("");
  const [hubId, setHubId] = useState("");
  const [institutionId, setInstitutionId] = useState("");
  const [status, setStatus] = useState("");
  const [editingEmployee, setEditingEmployee] = useState<HubEmployee | null>(null);
  const canManage = session ? userHasPermission(session.user, "people:manage") : false;

  const editFields: EditSheetField[] = [
    { label: "Name", name: "name", required: true },
    { label: "Email", name: "email", required: true, type: "email" },
    { label: "Phone", name: "phone" },
    { label: "Designation", name: "designation", required: true },
    {
      label: "Incubator",
      name: "hubId",
      options: hubs.map((hub) => ({ label: hub.name, value: hub.id })),
      required: true,
      type: "select",
    },
    {
      label: "School assignment",
      name: "institutionId",
      options: institutions.map((institution) => ({ label: institution.name, value: institution.id })),
      type: "select",
    },
    {
      label: "Status",
      name: "status",
      options: [
        { label: "Active", value: "active" },
        { label: "Invited", value: "invited" },
        { label: "Suspended", value: "suspended" },
      ],
      required: true,
      type: "select",
    },
  ];

  async function saveEmployee(values: Record<string, string | number | null | undefined>) {
    if (!editingEmployee) {
      return;
    }
    await apiPatch(
      `/api/people/${editingEmployee.id}`,
      {
        ...values,
        institutionId: values.institutionId === undefined ? null : values.institutionId,
      },
      session?.token,
    );
    setEditingEmployee(null);
    await refresh();
  }

  async function deleteEmployee(employee: HubEmployee) {
    if (!window.confirm(`Delete ${employee.name}?`)) {
      return;
    }
    await apiDelete(`/api/people/${employee.id}`, session?.token);
    await refresh();
  }

  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return employees.filter((employee) => {
      const matchesQuery =
        !needle ||
        [employee.name, employee.email, employee.designation, employee.hubName, employee.institutionName ?? ""].some((value) =>
          value.toLowerCase().includes(needle),
        );
      const matchesHub = !hubId || employee.hubId === hubId;
      const matchesInstitution = !institutionId || employee.institutionId === institutionId;
      const matchesStatus = !status || employee.status === status;
      return matchesQuery && matchesHub && matchesInstitution && matchesStatus;
    });
  }, [employees, hubId, institutionId, query, status]);

  return (
    <div className="workspace-scroll">
      <ViewHeader
        title="Employees"
        description="Incubator and school-level programme operators."
        action={
          canManage && (
            <Link className="ui-button ui-button-primary ui-button-md" to="/workspace/people/new">
              <Plus size={16} />
              Add employee
            </Link>
          )
        }
      />

      <div className="index-toolbar">
        <input
          aria-label="Search employees"
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Search employees..."
          value={query}
        />
        <select aria-label="Filter employees by incubator" onChange={(event) => setHubId(event.target.value)} value={hubId}>
          <option value="">All Incubators</option>
          {hubs.map((hub) => (
            <option key={hub.id} value={hub.id}>
              {hub.name}
            </option>
          ))}
        </select>
        <select aria-label="Filter employees by school" onChange={(event) => setInstitutionId(event.target.value)} value={institutionId}>
          <option value="">All Schools</option>
          {institutions.map((institution) => (
            <option key={institution.id} value={institution.id}>
              {institution.name}
            </option>
          ))}
        </select>
        <select aria-label="Filter employees by status" onChange={(event) => setStatus(event.target.value)} value={status}>
          <option value="">All Status</option>
          <option value="active">Active</option>
          <option value="invited">Invited</option>
          <option value="suspended">Suspended</option>
        </select>
        <span>{filtered.length} of {employees.length}</span>
      </div>

      <div className="index-table-card">
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Name</th>
                <th>Designation</th>
                <th>Incubator</th>
                <th>School</th>
                <th>Email</th>
                <th>Status</th>
                {canManage && <th>Actions</th>}
              </tr>
            </thead>
            <tbody>
              {filtered.map((employee) => (
                <tr key={employee.id}>
                  <td data-label="Name">
                    <span className="table-identity static">
                      <span>{employee.name.charAt(0)}</span>
                      <strong>{employee.name}</strong>
                      <small>{employee.email}</small>
                    </span>
                  </td>
                  <td data-label="Designation">{employee.designation}</td>
                  <td data-label="Incubator">{employee.hubName}</td>
                  <td data-label="School">{employee.institutionName ?? "Incubator level"}</td>
                  <td data-label="Email">{employee.email}</td>
                  <td data-label="Status">{employee.status}</td>
                  {canManage && (
                    <td data-label="Actions">
                      <ActionMenu
                        canDelete
                        canEdit
                        onDelete={() => void deleteEmployee(employee)}
                        onEdit={() => setEditingEmployee(employee)}
                      />
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      {editingEmployee && (
        <EditSheet
          description="Update employee assignment, contact details and active operating status."
          fields={editFields}
          initialValues={editingEmployee}
          onClose={() => setEditingEmployee(null)}
          onSubmit={saveEmployee}
          title={`Edit ${editingEmployee.name}`}
        />
      )}
    </div>
  );
}
