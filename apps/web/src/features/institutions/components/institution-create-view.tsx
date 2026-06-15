import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ArrowLeft, Building2 } from "lucide-react";
import { userHasPermission, type Institution } from "@scp/contracts";
import { Button, Panel } from "@scp/ui";
import { EmptyPermission } from "../../../components/common/empty-permission.js";
import { ViewHeader } from "../../../components/common/view-header.js";
import { apiPost } from "../../../lib/api.js";
import { useAuth } from "../../auth/auth-context.js";
import { useWorkspaceDataState, useWorkspaceSummary } from "../../workspace/workspace-data.js";

type InstitutionForm = {
  address: string;
  code: string;
  contactEmail: string;
  district: string;
  employeeCount: number;
  hubId: string;
  name: string;
  principalName: string;
  projectCount: number;
  region: string;
  status: "active" | "onboarding" | "attention";
  studentCount: number;
  type: "school";
};

export function InstitutionCreateView() {
  const { session } = useAuth();
  const { refresh } = useWorkspaceDataState();
  const { hubs } = useWorkspaceSummary();
  const navigate = useNavigate();
  const firstHubId = hubs[0]?.id ?? "";
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState<InstitutionForm>({
    address: "",
    code: "",
    contactEmail: "",
    district: "",
    employeeCount: 0,
    hubId: firstHubId,
    name: "",
    principalName: "",
    projectCount: 0,
    region: "",
    status: "onboarding" as const,
    studentCount: 0,
    type: "school" as const,
  });

  const canManage = session ? userHasPermission(session.user, "institutions:manage") : false;

  if (!session || !canManage) {
    return <EmptyPermission permission="institutions:manage" />;
  }

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const hubId = form.hubId || firstHubId;
    setError(null);

    if (!hubId) {
      setError("Create an incubator before adding a school.");
      return;
    }

    try {
      const payload = await apiPost<{ institution: Institution }>(
        "/api/institutions",
        {
          ...form,
          code: form.code || undefined,
          hubId,
        },
        session?.token,
      );
      await refresh();
      navigate(`/workspace/institutions/${payload.institution.id}`);
    } catch (unknownError) {
      setError(unknownError instanceof Error ? unknownError.message : "Could not create school");
    }
  }

  return (
    <div className="workspace-scroll">
      <ViewHeader
        title="New School"
        description="Map a school to an incubator and establish its programme operating profile."
        action={
          <Link className="ui-button ui-button-secondary ui-button-md" to="/workspace/institutions">
            <ArrowLeft size={16} />
            Schools
          </Link>
        }
      />

      <section className="create-flow">
        <Panel title="School profile" className="span-7">
          <form className="entity-form wide" onSubmit={submit}>
            <label>
              <span>School name</span>
              <input onChange={(event) => setForm((value) => ({ ...value, name: event.target.value }))} required value={form.name} />
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
              <span>School code</span>
              <input onChange={(event) => setForm((value) => ({ ...value, code: event.target.value.toUpperCase() }))} value={form.code} />
            </label>
            <label>
              <span>Region</span>
              <input onChange={(event) => setForm((value) => ({ ...value, region: event.target.value }))} required value={form.region} />
            </label>
            <label>
              <span>District</span>
              <input onChange={(event) => setForm((value) => ({ ...value, district: event.target.value }))} required value={form.district} />
            </label>
            <label>
              <span>Principal</span>
              <input onChange={(event) => setForm((value) => ({ ...value, principalName: event.target.value }))} required value={form.principalName} />
            </label>
            <label>
              <span>Contact email</span>
              <input onChange={(event) => setForm((value) => ({ ...value, contactEmail: event.target.value }))} required type="email" value={form.contactEmail} />
            </label>
            <label>
              <span>Status</span>
              <select onChange={(event) => setForm((value) => ({ ...value, status: event.target.value as InstitutionForm["status"] }))} value={form.status}>
                <option value="onboarding">Onboarding</option>
                <option value="active">Active</option>
                <option value="attention">Attention</option>
              </select>
            </label>
            <label className="full-width">
              <span>Address</span>
              <input onChange={(event) => setForm((value) => ({ ...value, address: event.target.value }))} required value={form.address} />
            </label>
            {error && <p className="form-error full-width">{error}</p>}
            <div className="form-actions full-width">
              <Link className="ui-button ui-button-secondary ui-button-md" to="/workspace/institutions">
                Cancel
              </Link>
              <Button type="submit" variant="primary">
                <Building2 size={16} />
                Create school
              </Button>
            </div>
          </form>
        </Panel>

        <Panel title="Next in flow" className="span-5">
          <ol className="flow-steps">
            <li>Choose the incubator anchor</li>
            <li className="active">Create school profile</li>
            <li>Assign employees or school champions</li>
            <li>Enroll students and project records</li>
          </ol>
        </Panel>
      </section>
    </div>
  );
}
