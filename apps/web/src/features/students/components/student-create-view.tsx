import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ArrowLeft, GraduationCap } from "lucide-react";
import { userHasPermission, type StudentRecord } from "@scp/contracts";
import { Button, Panel } from "@scp/ui";
import { EmptyPermission } from "../../../components/common/empty-permission.js";
import { ViewHeader } from "../../../components/common/view-header.js";
import { apiPost } from "../../../lib/api.js";
import { useAuth } from "../../auth/auth-context.js";
import { useWorkspaceDataState, useWorkspaceSummary } from "../../workspace/workspace-data.js";

type StudentForm = {
  email: string;
  grade: string;
  institutionId: string;
  mentorEmployeeId: string;
  name: string;
  projectCount: number;
  status: "active" | "paused" | "graduated";
};

export function StudentCreateView() {
  const { session } = useAuth();
  const { refresh } = useWorkspaceDataState();
  const { employees, institutions } = useWorkspaceSummary();
  const navigate = useNavigate();
  const firstInstitutionId = institutions[0]?.id ?? "";
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState<StudentForm>({
    email: "",
    grade: "",
    institutionId: firstInstitutionId,
    mentorEmployeeId: "",
    name: "",
    projectCount: 0,
    status: "active" as const,
  });

  const canManage = session ? userHasPermission(session.user, "students:manage") : false;

  if (!session || !canManage) {
    return <EmptyPermission permission="students:manage" />;
  }

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    try {
      const payload = await apiPost<{ student: StudentRecord }>(
        "/api/students",
        {
          ...form,
          institutionId: form.institutionId || firstInstitutionId,
          mentorEmployeeId: form.mentorEmployeeId || null,
        },
        session?.token,
      );
      await refresh();
      navigate(`/workspace/students/${payload.student.id}`);
    } catch (unknownError) {
      setError(unknownError instanceof Error ? unknownError.message : "Could not create student");
    }
  }

  return (
    <div className="workspace-scroll">
      <ViewHeader
        title="New Student"
        description="Enroll a student into the scoped school and connect mentorship/project activity."
        action={
          <Link className="ui-button ui-button-secondary ui-button-md" to="/workspace/students">
            <ArrowLeft size={16} />
            Students
          </Link>
        }
      />

      <section className="create-flow">
        <Panel title="Student record" className="span-7">
          <form className="entity-form wide" onSubmit={submit}>
            <label>
              <span>Name</span>
              <input onChange={(event) => setForm((value) => ({ ...value, name: event.target.value }))} required value={form.name} />
            </label>
            <label>
              <span>Email</span>
              <input onChange={(event) => setForm((value) => ({ ...value, email: event.target.value }))} required type="email" value={form.email} />
            </label>
            <label>
              <span>Grade</span>
              <input onChange={(event) => setForm((value) => ({ ...value, grade: event.target.value }))} required value={form.grade} />
            </label>
            <label>
              <span>School</span>
              <select onChange={(event) => setForm((value) => ({ ...value, institutionId: event.target.value }))} required value={form.institutionId || firstInstitutionId}>
                {institutions.map((institution) => (
                  <option key={institution.id} value={institution.id}>
                    {institution.name}
                  </option>
                ))}
              </select>
            </label>
            <label>
              <span>Mentor</span>
              <select onChange={(event) => setForm((value) => ({ ...value, mentorEmployeeId: event.target.value }))} value={form.mentorEmployeeId}>
                <option value="">Unassigned</option>
                {employees.map((employee) => (
                  <option key={employee.id} value={employee.id}>
                    {employee.name}
                  </option>
                ))}
              </select>
            </label>
            <label>
              <span>Projects</span>
              <input
                min={0}
                onChange={(event) => setForm((value) => ({ ...value, projectCount: Number(event.target.value) }))}
                type="number"
                value={form.projectCount}
              />
            </label>
            <label>
              <span>Status</span>
              <select onChange={(event) => setForm((value) => ({ ...value, status: event.target.value as StudentForm["status"] }))} value={form.status}>
                <option value="active">Active</option>
                <option value="paused">Paused</option>
                <option value="graduated">Graduated</option>
              </select>
            </label>
            {error && <p className="form-error full-width">{error}</p>}
            <div className="form-actions full-width">
              <Link className="ui-button ui-button-secondary ui-button-md" to="/workspace/students">
                Cancel
              </Link>
              <Button type="submit" variant="primary">
                <GraduationCap size={16} />
                Create student
              </Button>
            </div>
          </form>
        </Panel>

        <Panel title="Next in flow" className="span-5">
          <ol className="flow-steps">
            <li>Choose school scope</li>
            <li className="active">Create student record</li>
            <li>Review student detail and mentorship assignment</li>
            <li>Track student projects and status changes</li>
          </ol>
        </Panel>
      </section>
    </div>
  );
}
