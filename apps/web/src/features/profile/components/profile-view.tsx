import { useEffect, useState } from "react";
import { ShieldCheck, UserCircle2 } from "lucide-react";
import { roleLabels, type ProfileSummary } from "@scp/contracts";
import { Badge, Panel } from "@scp/ui";
import { ViewHeader } from "../../../components/common/view-header.js";
import { apiGet } from "../../../lib/api.js";
import { useAuth } from "../../auth/auth-context.js";

export function ProfileView() {
  const { session } = useAuth();
  const [profile, setProfile] = useState<ProfileSummary | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    void apiGet<{ profile: ProfileSummary }>("/api/profile", session?.token)
      .then((payload) => {
        setProfile(payload.profile);
        setError(null);
      })
      .catch((unknownError) => setError(unknownError instanceof Error ? unknownError.message : "Could not load profile"));
  }, [session?.token]);

  if (error) {
    return <div className="loading-state">{error}</div>;
  }

  if (!profile) {
    return <div className="loading-state">Loading profile</div>;
  }

  return (
    <div className="workspace-scroll">
      <ViewHeader eyebrow="Account" title="Profile" />

      <section className="dashboard-grid">
        <Panel className="span-5" title="User">
          <div className="profile-hero">
            <UserCircle2 size={34} />
            <div>
              <strong>{profile.name}</strong>
              <span>{profile.email}</span>
            </div>
          </div>
          <div className="badge-row">
            {profile.roles.map((role) => (
              <Badge key={role} tone="blue">
                {roleLabels[role as keyof typeof roleLabels] ?? role}
              </Badge>
            ))}
          </div>
        </Panel>

        <Panel className="span-7" title="Scope">
          <div className="scope-list profile-scope">
            <div>
              <dt>Organization</dt>
              <dd>{profile.scope.organizationName}</dd>
            </div>
            <div>
              <dt>Type</dt>
              <dd>{profile.scope.organizationType}</dd>
            </div>
            <div>
              <dt>Incubator</dt>
              <dd>{profile.scope.hubId ? profile.scope.hubId.slice(0, 8) : "All visible incubators"}</dd>
            </div>
            <div>
              <dt>School</dt>
              <dd>{profile.scope.institutionId ? profile.scope.institutionId.slice(0, 8) : "Scope dependent"}</dd>
            </div>
          </div>
        </Panel>

        <Panel className="span-12" title="Allowed operations" action={<ShieldCheck size={16} />}>
          <div className="permission-grid">
            {profile.permissions.map((permission) => (
              <span key={permission}>{permission}</span>
            ))}
          </div>
        </Panel>
      </section>
    </div>
  );
}
