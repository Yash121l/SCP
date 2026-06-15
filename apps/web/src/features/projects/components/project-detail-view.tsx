import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, ClipboardCheck, FolderKanban, MessageSquareText, School, Star, UserRound } from "lucide-react";
import { userHasPermission, type ProjectFeedback, type ProjectStatus, type StudentProject } from "@scp/contracts";
import { Button, Panel } from "@scp/ui";
import { ActionMenu } from "../../../components/common/action-menu.js";
import { EditSheet, type EditSheetField } from "../../../components/common/edit-sheet.js";
import { ProjectStatusBadge } from "../../../components/common/status-badge.js";
import { RecordTabs } from "../../../components/common/record-tabs.js";
import { apiDelete, apiGet, apiPatch, apiPost } from "../../../lib/api.js";
import { useAuth } from "../../auth/auth-context.js";
import { useWorkspaceDataState } from "../../workspace/workspace-data.js";
import { useWorkspaceSummary } from "../../workspace/workspace-data.js";

const statuses: ProjectStatus[] = [
  "proposed",
  "under_review",
  "approved",
  "in_progress",
  "on_hold",
  "completed",
  "rejected",
];

export function ProjectDetailView() {
  const { projectId } = useParams();
  const navigate = useNavigate();
  const { session } = useAuth();
  const { refresh } = useWorkspaceDataState();
  const { institutions, students } = useWorkspaceSummary();
  const [project, setProject] = useState<StudentProject | null>(null);
  const [status, setStatus] = useState<ProjectStatus>("proposed");
  const [reviewNote, setReviewNote] = useState("");
  const [feedback, setFeedback] = useState<ProjectFeedback[]>([]);
  const [feedbackNote, setFeedbackNote] = useState("");
  const [rating, setRating] = useState(4);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState("brief");
  const [editingProject, setEditingProject] = useState<StudentProject | null>(null);
  const canManage = session ? userHasPermission(session.user, "projects:manage") : false;
  const canAddFeedback = session ? userHasPermission(session.user, "project_feedback:manage") : false;
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
      options: statuses.map((item) => ({ label: item.replace("_", " "), value: item })),
      required: true,
      type: "select",
    },
    { label: "Problem statement", name: "problemStatement", required: true, type: "textarea" },
    { label: "Solution summary", name: "solutionSummary", required: true, type: "textarea" },
    { label: "Review note", name: "reviewNote", type: "textarea" },
  ];

  useEffect(() => {
    if (!projectId) {
      return;
    }

    void apiGet<{ project: StudentProject }>(`/api/projects/${projectId}`, session?.token)
      .then((payload) => {
        setProject(payload.project);
        setStatus(payload.project.status);
        setReviewNote(payload.project.reviewNote ?? "");
        setError(null);
      })
      .catch((unknownError) => setError(unknownError instanceof Error ? unknownError.message : "Could not load project"));

    void apiGet<{ feedback: ProjectFeedback[] }>(`/api/projects/${projectId}/feedback`, session?.token)
      .then((payload) => setFeedback(payload.feedback))
      .catch(() => setFeedback([]));
  }, [projectId, session?.token]);

  async function updateStatus(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!project) {
      return;
    }

    setError(null);
    try {
      const payload = await apiPatch<{ project: StudentProject }>(
        `/api/projects/${project.id}/status`,
        { reviewNote, status },
        session?.token,
      );
      setProject(payload.project);
      await refresh();
    } catch (unknownError) {
      setError(unknownError instanceof Error ? unknownError.message : "Could not update project status");
    }
  }

  async function addFeedback(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!project) {
      return;
    }

    setError(null);
    try {
      const payload = await apiPost<{ feedback: ProjectFeedback }>(
        `/api/projects/${project.id}/feedback`,
        { note: feedbackNote, rating },
        session?.token,
      );
      setFeedback((items) => [payload.feedback, ...items]);
      setFeedbackNote("");
      await refresh();
    } catch (unknownError) {
      setError(unknownError instanceof Error ? unknownError.message : "Could not add feedback");
    }
  }

  async function saveProject(values: Record<string, string | number | null | undefined>) {
    if (!editingProject) {
      return;
    }

    const payload = await apiPatch<{ project: StudentProject }>(
      `/api/projects/${editingProject.id}`,
      {
        ...values,
        reviewNote: values.reviewNote ?? null,
        studentId: values.studentId === undefined ? null : values.studentId,
      },
      session?.token,
    );
    setProject(payload.project);
    setStatus(payload.project.status);
    setReviewNote(payload.project.reviewNote ?? "");
    setEditingProject(null);
    await refresh();
  }

  async function deleteProject() {
    if (!project || !window.confirm(`Delete ${project.title}?`)) {
      return;
    }

    await apiDelete(`/api/projects/${project.id}`, session?.token);
    await refresh();
    navigate("/workspace/projects");
  }

  if (error && !project) {
    return <div className="loading-state">{error}</div>;
  }

  if (!project) {
    return <div className="loading-state">Loading project detail</div>;
  }

  return (
    <div className="workspace-scroll">
      <section className="record-header">
        <Link className="record-back" to="/workspace/projects">
          <ArrowLeft size={13} />
          Projects
        </Link>
        <div className="record-title-row">
          <div className="record-avatar">
            <FolderKanban size={18} />
          </div>
          <div>
            <h1>{project.title}</h1>
            <p>
              {project.domain} · {project.institutionName} · {project.ownerName}
            </p>
          </div>
          <div className="record-title-actions">
            <ProjectStatusBadge status={project.status} />
            {canManage && (
              <ActionMenu
                canDelete
                canEdit
                onDelete={() => void deleteProject()}
                onEdit={() => setEditingProject(project)}
              />
            )}
          </div>
        </div>
        <div className="metric-strip">
          <div>
            <span>Status</span>
            <strong>{project.status.replace("_", " ")}</strong>
          </div>
          <div>
            <span>Approval</span>
            <strong>{project.approvalId ? "Linked" : "Not linked"}</strong>
          </div>
          <div>
            <span>Owner</span>
            <strong>{project.ownerName}</strong>
          </div>
          <div>
            <span>School</span>
            <strong>{project.institutionName}</strong>
          </div>
        </div>
      </section>

      <RecordTabs
        activeTab={activeTab}
        onChange={setActiveTab}
        tabs={[
          { id: "brief", label: "Brief" },
          { id: "status", label: "Status" },
          { id: "feedback", label: "Feedback" },
          { id: "scope", label: "Scope" },
        ]}
      />

      <section className="dashboard-grid">
        {activeTab === "brief" && (
          <Panel className="span-12" title="Project brief">
            <div className="profile-list">
              <div>
                <FolderKanban size={16} />
                <span>{project.problemStatement}</span>
              </div>
              <div>
                <ClipboardCheck size={16} />
                <span>{project.solutionSummary}</span>
              </div>
            </div>
          </Panel>
        )}

        {activeTab === "scope" && (
          <Panel className="span-12" title="Scope">
            <div className="profile-list">
              <div>
                <School size={16} />
                <span>{project.institutionName}</span>
              </div>
              <div>
                <UserRound size={16} />
                <span>{project.studentName ?? project.ownerEmail}</span>
              </div>
            </div>
          </Panel>
        )}

        {activeTab === "status" && (
          <Panel className="span-12" title="Status control">
            {canManage ? (
              <form className="entity-form" onSubmit={updateStatus}>
                <label>
                  <span>Status</span>
                  <select onChange={(event) => setStatus(event.target.value as ProjectStatus)} value={status}>
                    {statuses.map((item) => (
                      <option key={item} value={item}>
                        {item.replace("_", " ")}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="full-width">
                  <span>Review note</span>
                  <input onChange={(event) => setReviewNote(event.target.value)} value={reviewNote} />
                </label>
                {error && <p className="form-error full-width">{error}</p>}
                <div className="form-actions full-width">
                  <Button type="submit" variant="primary">
                    Update status
                  </Button>
                </div>
              </form>
            ) : (
              <p className="empty-table-cell">Status updates are restricted for this role.</p>
            )}
          </Panel>
        )}

        {activeTab === "feedback" && (
          <Panel className="span-12" title="Expert feedback">
            {canAddFeedback && (
              <form className="entity-form feedback-form" onSubmit={addFeedback}>
                <label>
                  <span>Rating</span>
                  <select onChange={(event) => setRating(Number(event.target.value))} value={rating}>
                    {[5, 4, 3, 2, 1].map((item) => (
                      <option key={item} value={item}>
                        {item}/5
                      </option>
                    ))}
                  </select>
                </label>
                <label className="full-width">
                  <span>Feedback note</span>
                  <input onChange={(event) => setFeedbackNote(event.target.value)} value={feedbackNote} />
                </label>
                <div className="form-actions full-width">
                  <Button type="submit" variant="primary">
                    <MessageSquareText size={16} />
                    Add feedback
                  </Button>
                </div>
              </form>
            )}

            <div className="compact-list feedback-list">
              {feedback.map((item) => (
                <div className="compact-row" key={item.id}>
                  <Star size={15} />
                  <div>
                    <strong>{item.expertName} · {item.rating}/5</strong>
                    <span>{item.expertOrganization}</span>
                    <span>{item.note}</span>
                  </div>
                </div>
              ))}
              {feedback.length === 0 && (
                <p className="empty-table-cell">No expert feedback has been recorded for this project.</p>
              )}
            </div>
          </Panel>
        )}
      </section>
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
