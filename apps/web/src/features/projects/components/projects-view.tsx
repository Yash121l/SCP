import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { FolderKanban, Plus } from "lucide-react";
import { userHasPermission, type StudentProject } from "@scp/contracts";
import { Badge } from "@scp/ui";
import { ActionMenu } from "../../../components/common/action-menu.js";
import { EditSheet, type EditSheetField } from "../../../components/common/edit-sheet.js";
import { ProjectStatusBadge } from "../../../components/common/status-badge.js";
import { ViewHeader } from "../../../components/common/view-header.js";
import { apiDelete, apiPatch } from "../../../lib/api.js";
import { useAuth } from "../../auth/auth-context.js";
import { useWorkspaceDataState, useWorkspaceSummary } from "../../workspace/workspace-data.js";

export function ProjectsView() {
  const { session } = useAuth();
  const { refresh } = useWorkspaceDataState();
  const { institutions, projects, students } = useWorkspaceSummary();
  const [query, setQuery] = useState("");
  const [institutionId, setInstitutionId] = useState("");
  const [status, setStatus] = useState("");
  const [editingProject, setEditingProject] = useState<StudentProject | null>(null);
  const canManage = session ? userHasPermission(session.user, "projects:manage") : false;

  const editFields: EditSheetField[] = [
    { label: "Title", name: "title", required: true },
    { label: "Domain", name: "domain", required: true },
    {
      label: "School",
      name: "institutionId",
      options: institutions.map((institution) => ({ label: institution.name, value: institution.id })),
      required: true,
      type: "select",
    },
    {
      label: "Student owner",
      name: "studentId",
      options: students.map((student) => ({ label: `${student.name} · ${student.grade}`, value: student.id })),
      type: "select",
    },
    { label: "Owner name", name: "ownerName", required: true },
    { label: "Owner email", name: "ownerEmail", required: true, type: "email" },
    {
      label: "Status",
      name: "status",
      options: [
        { label: "Proposed", value: "proposed" },
        { label: "Under review", value: "under_review" },
        { label: "Approved", value: "approved" },
        { label: "In progress", value: "in_progress" },
        { label: "On hold", value: "on_hold" },
        { label: "Completed", value: "completed" },
        { label: "Rejected", value: "rejected" },
      ],
      required: true,
      type: "select",
    },
    { label: "Problem statement", name: "problemStatement", required: true, type: "textarea" },
    { label: "Solution summary", name: "solutionSummary", required: true, type: "textarea" },
    { label: "Review note", name: "reviewNote", type: "textarea" },
  ];

  async function saveProject(values: Record<string, string | number | null | undefined>) {
    if (!editingProject) {
      return;
    }
    await apiPatch(
      `/api/projects/${editingProject.id}`,
      {
        ...values,
        reviewNote: values.reviewNote ?? null,
        studentId: values.studentId === undefined ? null : values.studentId,
      },
      session?.token,
    );
    setEditingProject(null);
    await refresh();
  }

  async function deleteProject(project: StudentProject) {
    if (!window.confirm(`Delete ${project.title}?`)) {
      return;
    }
    await apiDelete(`/api/projects/${project.id}`, session?.token);
    await refresh();
  }

  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return projects.filter((project) => {
      const matchesQuery =
        !needle ||
        [
          project.title,
          project.domain,
          project.ownerName,
          project.institutionName,
          project.studentName ?? "",
        ].some((value) => value.toLowerCase().includes(needle));
      const matchesInstitution = !institutionId || project.institutionId === institutionId;
      const matchesStatus = !status || project.status === status;
      return matchesQuery && matchesInstitution && matchesStatus;
    });
  }, [institutionId, projects, query, status]);

  return (
    <div className="workspace-scroll">
      <ViewHeader
        title="Projects"
        description="Raised project requests, approval linkage, owner scope and execution status."
        action={
          canManage && (
            <Link className="ui-button ui-button-primary ui-button-md" to="/workspace/projects/new">
              <Plus size={16} />
              Raise project
            </Link>
          )
        }
      />

      <div className="index-toolbar">
        <input
          aria-label="Search projects"
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Search projects..."
          value={query}
        />
        <select aria-label="Filter projects by school" onChange={(event) => setInstitutionId(event.target.value)} value={institutionId}>
          <option value="">All Schools</option>
          {institutions.map((institution) => (
            <option key={institution.id} value={institution.id}>
              {institution.name}
            </option>
          ))}
        </select>
        <select aria-label="Filter projects by status" onChange={(event) => setStatus(event.target.value)} value={status}>
          <option value="">All Status</option>
          <option value="proposed">Proposed</option>
          <option value="under_review">Under review</option>
          <option value="approved">Approved</option>
          <option value="in_progress">In progress</option>
          <option value="on_hold">On hold</option>
          <option value="completed">Completed</option>
          <option value="rejected">Rejected</option>
        </select>
        <span>{filtered.length} of {projects.length}</span>
      </div>

      <div className="index-table-card">
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Project</th>
                <th>Domain</th>
                <th>Owner</th>
                <th>School</th>
                <th>Approval</th>
                <th>Status</th>
                {canManage && <th>Actions</th>}
              </tr>
            </thead>
            <tbody>
              {filtered.map((project) => (
                <tr key={project.id}>
                  <td data-label="Project">
                    <Link className="table-identity" to={`/workspace/projects/${project.id}`}>
                      <span>
                        <FolderKanban size={14} />
                      </span>
                      <strong>{project.title}</strong>
                      <small>{project.problemStatement}</small>
                    </Link>
                  </td>
                  <td data-label="Domain">{project.domain}</td>
                  <td data-label="Owner">{project.ownerName}</td>
                  <td data-label="School">{project.institutionName}</td>
                  <td data-label="Approval">{project.approvalId ? <Badge tone="blue">linked</Badge> : <Badge tone="neutral">none</Badge>}</td>
                  <td data-label="Status">
                    <ProjectStatusBadge status={project.status} />
                  </td>
                  {canManage && (
                    <td data-label="Actions">
                      <ActionMenu
                        canDelete
                        canEdit
                        onDelete={() => void deleteProject(project)}
                        onEdit={() => setEditingProject(project)}
                      />
                    </td>
                  )}
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td className="empty-table-cell" colSpan={canManage ? 7 : 6} data-label="Empty">
                    <Badge>No projects match your filters</Badge>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
      {editingProject && (
        <EditSheet
          description="Update ownership, school/student mapping, status and review context."
          fields={editFields}
          initialValues={editingProject}
          onClose={() => setEditingProject(null)}
          onSubmit={saveProject}
          title={`Edit ${editingProject.title}`}
        />
      )}
    </div>
  );
}
