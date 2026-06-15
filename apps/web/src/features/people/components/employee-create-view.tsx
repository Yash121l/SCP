import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ArrowLeft, Users } from "lucide-react";
import { userHasPermission, type HubEmployee } from "@scp/contracts";
import { Button, Panel } from "@scp/ui";
import { EmptyPermission } from "../../../components/common/empty-permission.js";
import { ViewHeader } from "../../../components/common/view-header.js";
import { apiPost } from "../../../lib/api.js";
import { useAuth } from "../../auth/auth-context.js";
import { useWorkspaceDataState, useWorkspaceSummary } from "../../workspace/workspace-data.js";

export function EmployeeCreateView() {
  const { session } = useAuth();
  const { refresh } = useWorkspaceDataState();
  const { hubs, institutions } = useWorkspaceSummary();
  const navigate = useNavigate();
  const firstHubId = hubs[0]?.id ?? "";
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState({
    designation: "",
    email: "",
    hubId: firstHubId,
    institutionId: "",
    name: "",
    phone: "",
  });

  const canManage = session ? userHasPermission(session.user, "people:manage") : false;

  if (!session || !canManage) {
    return <EmptyPermission permission="people:manage" />;
  }

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    try {
      await apiPost<{ employee: HubEmployee }>(
        "/api/people",
        {
          ...form,
          hubId: form.hubId || firstHubId,
          institutionId: form.institutionId || null,
        },
        session?.token,
      );
      await refresh();
      navigate("/workspace/people");
    } catch (unknownError) {
      setError(unknownError instanceof Error ? unknownError.message : "Could not create employee");
    }
  }

  return (
    <div className="workspace-scroll">
      <ViewHeader
        title="New Employee"
        description="Add an incubator-level operator or a school-assigned employee."
        action={
          <Link className="ui-button ui-button-secondary ui-button-md" to="/workspace/people">
            <ArrowLeft size={16} />
            Employees
          </Link>
        }
      />

      <div className="flow-steps-wrapper">
        <ol className="flow-steps">
          <li>Choose incubator scope</li>
          <li className="active">Create employee assignment</li>
          <li>Assign student mentorship where needed</li>
          <li>Track activity through school and student records</li>
        </ol>
      </div>

      <section className="create-flow">
        <Panel title="Employee assignment">
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
              <span>Designation</span>
              <input onChange={(event) => setForm((value) => ({ ...value, designation: event.target.value }))} required value={form.designation} />
            </label>
            <label>
              <span>Phone</span>
              <input onChange={(event) => setForm((value) => ({ ...value, phone: event.target.value }))} value={form.phone} />
            </label>
            <label>
              <span>Incubator</span>
              <select onChange={(event) => setForm((value) => ({ ...value, hubId: event.target.value }))} required value={form.hubId || firstHubId}>
                {hubs.map((hub) => (
                  <option key={hub.id} value={hub.id}>
                    {hub.name}
                  </option>
                ))}
              </select>
            </label>
            <label>
              <span>School</span>
              <select onChange={(event) => setForm((value) => ({ ...value, institutionId: event.target.value }))} value={form.institutionId}>
                <option value="">Incubator level</option>
                {institutions.map((institution) => (
                  <option key={institution.id} value={institution.id}>
                    {institution.name}
                  </option>
                ))}
              </select>
            </label>
            {error && <p className="form-error full-width">{error}</p>}
            <div className="form-actions full-width">
              <Link className="ui-button ui-button-secondary ui-button-md" to="/workspace/people">
                Cancel
              </Link>
              <Button type="submit" variant="primary">
                <Users size={16} />
                Create employee
              </Button>
            </div>
          </form>
        </Panel>
      </section>
    </div>
  );
}
