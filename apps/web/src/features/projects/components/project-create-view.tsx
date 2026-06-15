import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ArrowLeft, FolderKanban } from "lucide-react";
import { userHasPermission, type StudentProject } from "@scp/contracts";
import { Button, Panel } from "@scp/ui";
import { EmptyPermission } from "../../../components/common/empty-permission.js";
import { ViewHeader } from "../../../components/common/view-header.js";
import { apiPost } from "../../../lib/api.js";
import { useAuth } from "../../auth/auth-context.js";
import { useWorkspaceDataState, useWorkspaceSummary } from "../../workspace/workspace-data.js";

export function ProjectCreateView() {
  const { session } = useAuth();
  const { refresh } = useWorkspaceDataState();
  const { institutions, students } = useWorkspaceSummary();
  const navigate = useNavigate();
  const firstInstitutionId = institutions[0]?.id ?? "";
  const firstStudentId = students[0]?.id ?? "";
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState({
    domain: "Community innovation",
    institutionId: firstInstitutionId,
    ownerEmail: session?.user.email ?? "",
    ownerName: session?.user.name ?? "",
    problemStatement: "",
    solutionSummary: "",
    studentId: firstStudentId,
    title: "",
  });

  const canManage = session ? userHasPermission(session.user, "projects:manage") : false;

  if (!session || !canManage) {
    return <EmptyPermission permission="projects:manage" />;
  }

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    try {
      const payload = await apiPost<{ project: StudentProject }>(
        "/api/projects",
        {
          ...form,
          institutionId: form.institutionId || undefined,
          ownerEmail: form.ownerEmail || undefined,
          ownerName: form.ownerName || undefined,
          studentId: form.studentId || null,
        },
        session?.token,
      );
      await refresh();
      navigate(`/workspace/projects/${payload.project.id}`);
    } catch (unknownError) {
      setError(unknownError instanceof Error ? unknownError.message : "Could not raise project");
    }
  }

  return (
    <div className="workspace-scroll">
      <ViewHeader
        title="New Project"
        description="Raise a project request and send it into the governance approval queue."
        action={
          <Link className="ui-button ui-button-secondary ui-button-md" to="/workspace/projects">
            <ArrowLeft size={16} />
            Projects
          </Link>
        }
      />

      <div className="flow-steps-wrapper">
        <ol className="flow-steps">
          <li className="active">Raise project request</li>
          <li>Approval entry is created automatically</li>
          <li>Committee reviews in Governance</li>
          <li>Project status moves through execution</li>
        </ol>
      </div>

      <section className="create-flow">
        <Panel title="Project request">
          <form className="entity-form wide" onSubmit={submit}>
            <label className="full-width">
              <span>Project title</span>
              <input onChange={(event) => setForm((value) => ({ ...value, title: event.target.value }))} required value={form.title} />
            </label>
            <label>
              <span>Domain</span>
              <input onChange={(event) => setForm((value) => ({ ...value, domain: event.target.value }))} required value={form.domain} />
            </label>
            <label>
              <span>School</span>
              <select onChange={(event) => setForm((value) => ({ ...value, institutionId: event.target.value }))} value={form.institutionId}>
                {institutions.map((institution) => (
                  <option key={institution.id} value={institution.id}>
                    {institution.name}
                  </option>
                ))}
              </select>
            </label>
            <label>
              <span>Student owner</span>
              <select onChange={(event) => setForm((value) => ({ ...value, studentId: event.target.value }))} value={form.studentId}>
                <option value="">School-level project</option>
                {students.map((student) => (
                  <option key={student.id} value={student.id}>
                    {student.name}
                  </option>
                ))}
              </select>
            </label>
            <label>
              <span>Owner name</span>
              <input onChange={(event) => setForm((value) => ({ ...value, ownerName: event.target.value }))} value={form.ownerName} />
            </label>
            <label>
              <span>Owner email</span>
              <input onChange={(event) => setForm((value) => ({ ...value, ownerEmail: event.target.value }))} type="email" value={form.ownerEmail} />
            </label>
            <label className="full-width">
              <span>Problem statement</span>
              <input onChange={(event) => setForm((value) => ({ ...value, problemStatement: event.target.value }))} required value={form.problemStatement} />
            </label>
            <label className="full-width">
              <span>Solution summary</span>
              <input onChange={(event) => setForm((value) => ({ ...value, solutionSummary: event.target.value }))} required value={form.solutionSummary} />
            </label>
            {error && <p className="form-error full-width">{error}</p>}
            <div className="form-actions full-width">
              <Link className="ui-button ui-button-secondary ui-button-md" to="/workspace/projects">
                Cancel
              </Link>
              <Button type="submit" variant="primary">
                <FolderKanban size={16} />
                Raise project
              </Button>
            </div>
          </form>
        </Panel>
      </section>
    </div>
  );
}
