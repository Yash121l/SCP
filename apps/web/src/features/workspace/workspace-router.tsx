import type { Role } from "../../types";
import type { RoleWorkspace, WorkspaceTab } from "./workspace.types";
import { AuditView } from "./views/audit-view";
import { DashboardView } from "./views/dashboard-view";
import { GovernanceView } from "./views/governance-view";
import { InstitutionsView } from "./views/institutions-view";
import { OnboardingView } from "./views/onboarding-view";
import { ProfileView } from "./views/profile-view";
import { ProjectsView } from "./views/projects-view";
import { ReportsView } from "./views/reports-view";
import { ResourcesView } from "./views/resources-view";

export function WorkspaceRouter({
  activeTab,
  role,
  search,
  workspace,
}: {
  activeTab: WorkspaceTab;
  role: Role;
  search: string;
  workspace: RoleWorkspace;
}) {
  if (activeTab.kind === "overview") return <DashboardView role={role} workspace={workspace} />;
  if (activeTab.kind === "profile") return <ProfileView role={role} workspace={workspace} />;
  if (activeTab.kind === "onboarding") return <OnboardingView role={role} workspace={workspace} />;
  if (activeTab.kind === "institutions" || activeTab.kind === "students") {
    return <InstitutionsView activeTab={activeTab} role={role} search={search} />;
  }
  if (["projects", "mentoring", "impact"].includes(activeTab.kind)) {
    return <ProjectsView activeTab={activeTab} role={role} search={search} />;
  }
  if (activeTab.kind === "governance") {
    return <GovernanceView activeTab={activeTab} role={role} search={search} />;
  }
  if (activeTab.kind === "learning" || activeTab.kind === "resources") {
    return <ResourcesView activeTab={activeTab} role={role} search={search} />;
  }
  if (activeTab.kind === "reports" || activeTab.kind === "funding") {
    return <ReportsView activeTab={activeTab} role={role} search={search} />;
  }
  return <AuditView activeTab={activeTab} role={role} />;
}
