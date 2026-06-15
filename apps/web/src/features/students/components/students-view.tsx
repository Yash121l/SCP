import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Plus } from "lucide-react";
import { userHasPermission, type StudentRecord } from "@scp/contracts";
import { ActionMenu } from "../../../components/common/action-menu.js";
import { EditSheet, type EditSheetField } from "../../../components/common/edit-sheet.js";
import { StudentStatusBadge } from "../../../components/common/status-badge.js";
import { ViewHeader } from "../../../components/common/view-header.js";
import { apiDelete, apiPatch } from "../../../lib/api.js";
import { useAuth } from "../../auth/auth-context.js";
import { useWorkspaceDataState, useWorkspaceSummary } from "../../workspace/workspace-data.js";

export function StudentsView() {
  const { session } = useAuth();
  const { refresh } = useWorkspaceDataState();
  const { employees, hubs, institutions, students } = useWorkspaceSummary();
  const [query, setQuery] = useState("");
  const [hubId, setHubId] = useState("");
  const [institutionId, setInstitutionId] = useState("");
  const [status, setStatus] = useState("");
  const [editingStudent, setEditingStudent] = useState<StudentRecord | null>(null);
  const canManage = session ? userHasPermission(session.user, "students:manage") : false;

  const editFields: EditSheetField[] = [
    { label: "Name", name: "name", required: true },
    { label: "Email", name: "email", required: true, type: "email" },
    { label: "Grade", name: "grade", required: true },
    {
      label: "School",
      name: "institutionId",
      options: institutions.map((institution) => ({ label: institution.name, value: institution.id })),
      required: true,
      type: "select",
    },
    {
      label: "Mentor",
      name: "mentorEmployeeId",
      options: employees.map((employee) => ({ label: `${employee.name} · ${employee.designation}`, value: employee.id })),
      type: "select",
    },
    {
      label: "Status",
      name: "status",
      options: [
        { label: "Active", value: "active" },
        { label: "Paused", value: "paused" },
        { label: "Graduated", value: "graduated" },
      ],
      required: true,
      type: "select",
    },
    { label: "Projects", min: 0, name: "projectCount", type: "number" },
  ];

  async function saveStudent(values: Record<string, string | number | null | undefined>) {
    if (!editingStudent) {
      return;
    }
    await apiPatch(
      `/api/students/${editingStudent.id}`,
      {
        ...values,
        mentorEmployeeId: values.mentorEmployeeId === undefined ? null : values.mentorEmployeeId,
      },
      session?.token,
    );
    setEditingStudent(null);
    await refresh();
  }

  async function deleteStudent(student: StudentRecord) {
    if (!window.confirm(`Delete ${student.name}?`)) {
      return;
    }
    await apiDelete(`/api/students/${student.id}`, session?.token);
    await refresh();
  }

  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return students.filter((student) => {
      const matchesQuery =
        !needle ||
        [student.name, student.email, student.grade, student.institutionName, student.hubName].some((value) =>
          value.toLowerCase().includes(needle),
        );
      const matchesHub = !hubId || student.hubId === hubId;
      const matchesInstitution = !institutionId || student.institutionId === institutionId;
      const matchesStatus = !status || student.status === status;
      return matchesQuery && matchesHub && matchesInstitution && matchesStatus;
    });
  }, [hubId, institutionId, query, status, students]);

  return (
    <div className="workspace-scroll">
      <ViewHeader
        title="Students"
        description="Student records, school placement, mentorship and project load."
        action={
          canManage && (
            <Link className="ui-button ui-button-primary ui-button-md" to="/workspace/students/new">
              <Plus size={16} />
              Add student
            </Link>
          )
        }
      />

      <div className="index-toolbar">
        <input
          aria-label="Search students"
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Search students..."
          value={query}
        />
        <select aria-label="Filter students by incubator" onChange={(event) => setHubId(event.target.value)} value={hubId}>
          <option value="">All Incubators</option>
          {hubs.map((hub) => (
            <option key={hub.id} value={hub.id}>
              {hub.name}
            </option>
          ))}
        </select>
        <select aria-label="Filter students by school" onChange={(event) => setInstitutionId(event.target.value)} value={institutionId}>
          <option value="">All Schools</option>
          {institutions.map((institution) => (
            <option key={institution.id} value={institution.id}>
              {institution.name}
            </option>
          ))}
        </select>
        <select aria-label="Filter students by status" onChange={(event) => setStatus(event.target.value)} value={status}>
          <option value="">All Status</option>
          <option value="active">Active</option>
          <option value="paused">Paused</option>
          <option value="graduated">Graduated</option>
        </select>
        <span>{filtered.length} of {students.length}</span>
      </div>

      <div className="index-table-card">
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Name</th>
                <th>School</th>
                <th>Incubator</th>
                <th>Grade</th>
                <th>Projects</th>
                <th>Status</th>
                {canManage && <th>Actions</th>}
              </tr>
            </thead>
            <tbody>
              {filtered.map((student) => (
                <tr key={student.id}>
                  <td data-label="Name">
                    <Link className="table-identity" to={`/workspace/students/${student.id}`}>
                      <span>{student.name.charAt(0)}</span>
                      <strong>{student.name}</strong>
                      <small>{student.email}</small>
                    </Link>
                  </td>
                  <td data-label="School">{student.institutionName}</td>
                  <td data-label="Incubator">{student.hubName}</td>
                  <td data-label="Grade">{student.grade}</td>
                  <td data-label="Projects">{student.projectCount}</td>
                  <td data-label="Status">
                    <StudentStatusBadge status={student.status} />
                  </td>
                  {canManage && (
                    <td data-label="Actions">
                      <ActionMenu
                        canDelete
                        canEdit
                        onDelete={() => void deleteStudent(student)}
                        onEdit={() => setEditingStudent(student)}
                      />
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      {editingStudent && (
        <EditSheet
          description="Update student placement, grade, mentor, status and project load."
          fields={editFields}
          initialValues={editingStudent}
          onClose={() => setEditingStudent(null)}
          onSubmit={saveStudent}
          title={`Edit ${editingStudent.name}`}
        />
      )}
    </div>
  );
}
