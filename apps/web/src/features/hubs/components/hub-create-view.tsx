import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ArrowLeft, Network } from "lucide-react";
import { userHasPermission, type IncubationHub } from "@scp/contracts";
import { Button, Panel } from "@scp/ui";
import { EmptyPermission } from "../../../components/common/empty-permission.js";
import { ViewHeader } from "../../../components/common/view-header.js";
import { apiPost } from "../../../lib/api.js";
import { useAuth } from "../../auth/auth-context.js";
import { useWorkspaceDataState } from "../../workspace/workspace-data.js";

type HubForm = {
  code: string;
  district: string;
  name: string;
  region: string;
  status: "active" | "onboarding" | "attention";
};

const initialForm: HubForm = {
  code: "",
  district: "",
  name: "",
  region: "",
  status: "onboarding",
};

export function HubCreateView() {
  const { session } = useAuth();
  const { refresh } = useWorkspaceDataState();
  const navigate = useNavigate();
  const [form, setForm] = useState<HubForm>(initialForm);
  const [error, setError] = useState<string | null>(null);

  const canManage = session ? userHasPermission(session.user, "hubs:manage") : false;

  if (!session || !canManage) {
    return <EmptyPermission permission="hubs:manage" />;
  }

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    try {
      const payload = await apiPost<{ hub: IncubationHub }>("/api/hubs", form, session?.token);
      await refresh();
      navigate(`/workspace/hubs/${payload.hub.id}`);
    } catch (unknownError) {
      setError(unknownError instanceof Error ? unknownError.message : "Could not create incubator");
    }
  }

  return (
    <div className="workspace-scroll">
      <ViewHeader
        title="New Incubator"
        description="Create a new SAKSHAM Studio anchor before mapping schools and employees."
        action={
          <Link className="ui-button ui-button-secondary ui-button-md" to="/workspace/hubs">
            <ArrowLeft size={16} />
            Incubators
          </Link>
        }
      />

      <section className="create-flow">
        <Panel title="Incubator identity" className="span-7">
          <form className="entity-form" onSubmit={submit}>
            <label>
              <span>Incubator code</span>
              <input
                onChange={(event) => setForm((value) => ({ ...value, code: event.target.value.toUpperCase() }))}
                required
                value={form.code}
              />
            </label>
            <label>
              <span>Name</span>
              <input onChange={(event) => setForm((value) => ({ ...value, name: event.target.value }))} required value={form.name} />
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
              <span>Status</span>
              <select onChange={(event) => setForm((value) => ({ ...value, status: event.target.value as HubForm["status"] }))} value={form.status}>
                <option value="onboarding">Onboarding</option>
                <option value="active">Active</option>
                <option value="attention">Attention</option>
              </select>
            </label>
            {error && <p className="form-error full-width">{error}</p>}
            <div className="form-actions full-width">
              <Link className="ui-button ui-button-secondary ui-button-md" to="/workspace/hubs">
                Cancel
              </Link>
              <Button type="submit" variant="primary">
                <Network size={16} />
                Create incubator
              </Button>
            </div>
          </form>
        </Panel>

        <Panel title="Next in flow" className="span-5">
          <ol className="flow-steps">
            <li className="active">Create incubator anchor</li>
            <li>Map 5-10 schools to the incubator</li>
            <li>Assign incubator employees and school champions</li>
            <li>Enroll students and track project activity</li>
          </ol>
        </Panel>
      </section>
    </div>
  );
}
