import { Bell, Building2, GraduationCap, Rocket, Users } from "lucide-react";
import { Badge, Card, CardContent, CardDescription, CardHeader, CardTitle, Progress } from "@scp/ui";
import { Kpi } from "../../../components/common/kpi";
import { LoadingState } from "../../../components/common/loading-state";
import { api } from "../../../lib/api";
import { formatNumber } from "../../../lib/format";
import { statusVariant } from "../../../lib/status";
import { useAsyncData } from "../../../hooks/use-async-data";
import type { Dashboard, Role } from "../../../types";
import type { RoleWorkspace } from "../workspace.types";
import { ApprovalList } from "../components/approval-list";
import { OnboardingCard } from "../components/onboarding-card";

export function DashboardView({ role, workspace }: { role: Role; workspace: RoleWorkspace }) {
  const { data, error, loading } = useAsyncData<Dashboard | null>(
    () => api.dashboard(role.id),
    [role.id],
    null,
  );

  if (loading || !data) return <LoadingState label="Loading workspace" error={error} />;

  return (
    <div className="grid max-w-7xl gap-4 xl:grid-cols-[minmax(0,1.3fr)_360px]">
      <section className="relative overflow-hidden rounded-lg border bg-card p-4 shadow-panel xl:col-span-2">
        <div className="relative grid gap-4 lg:grid-cols-[minmax(0,1fr)_260px] lg:items-end">
          <div>
            <Badge variant="outline">{workspace.commandLabel}</Badge>
            <h1 className="mt-3 max-w-3xl text-2xl font-semibold leading-tight tracking-normal md:text-3xl">
              {workspace.headline}
            </h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
              {workspace.subline}
            </p>
          </div>
          <Card className="bg-background/70 shadow-none">
            <CardHeader className="p-3">
              <CardDescription>Workspace readiness</CardDescription>
              <CardTitle className="text-2xl">{data.metrics.health}%</CardTitle>
              <Progress value={data.metrics.health} />
            </CardHeader>
          </Card>
        </div>
      </section>

      <section className="grid gap-3 sm:grid-cols-2 xl:col-span-2 xl:grid-cols-5">
        <Kpi icon={Building2} label="Incubators" value={data.metrics.incubators} detail="Mapped partners" />
        <Kpi icon={GraduationCap} label="Schools" value={data.metrics.schools} detail="Active coverage" />
        <Kpi icon={Users} label="Students" value={formatNumber(data.metrics.students)} detail="Onboarded" />
        <Kpi icon={Rocket} label="Projects" value={data.metrics.projects} detail={`${data.metrics.reviews} need review`} />
        <Kpi icon={Bell} label="Actions" value={data.metrics.approvals} detail="Open workflow items" />
      </section>

      <Card className="shadow-panel">
        <CardHeader>
          <CardDescription>{role.label}</CardDescription>
          <CardTitle>Role highlights</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-3 md:grid-cols-3">
          {workspace.highlights.map((item) => (
            <div className="rounded-lg border bg-muted/20 p-3" key={item.label}>
              <span className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
                {item.label}
              </span>
              <strong className="mt-1 block text-xl">{item.value}</strong>
              <small className="text-muted-foreground">{item.detail}</small>
            </div>
          ))}
        </CardContent>
      </Card>

      <OnboardingCard workspace={workspace} />

      <Card className="shadow-panel">
        <CardHeader>
          <CardDescription>Priority work</CardDescription>
          <CardTitle>Next actions</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-3">
          {data.nextActions.map((project) => (
            <div className="rounded-lg border bg-muted/20 p-3" key={project.id}>
              <div className="flex items-start justify-between gap-3">
                <div>
                  <strong className="block">{project.title}</strong>
                  <span className="text-sm text-muted-foreground">{project.next_action}</span>
                </div>
                <Badge variant={statusVariant(project.risk)}>{project.risk}</Badge>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      <Card className="shadow-panel">
        <CardHeader>
          <CardDescription>Workflow</CardDescription>
          <CardTitle>Open queue</CardTitle>
        </CardHeader>
        <CardContent>
          <ApprovalList approvals={data.approvals} role={role} />
        </CardContent>
      </Card>
    </div>
  );
}
