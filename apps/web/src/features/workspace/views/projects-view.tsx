import { Badge, Card, CardContent, CardDescription, CardHeader, CardTitle, Progress } from "@scp/ui";
import { Meta } from "../../../components/common/meta";
import { LoadingState } from "../../../components/common/loading-state";
import { Section } from "../../../components/common/section";
import { api } from "../../../lib/api";
import { formatDate } from "../../../lib/format";
import { statusVariant } from "../../../lib/status";
import { useAsyncData } from "../../../hooks/use-async-data";
import type { Project, Role } from "../../../types";
import type { WorkspaceTab } from "../workspace.types";

export function ProjectsView({
  activeTab,
  role,
  search,
}: {
  activeTab: WorkspaceTab;
  role: Role;
  search: string;
}) {
  const { data, error, loading } = useAsyncData<Project[]>(
    () => api.projects(role.id, search).then((result) => result.projects),
    [role.id, search],
    [],
  );

  return (
    <Section title={activeTab.label} description={activeTab.description}>
      {loading ? <LoadingState label={`Loading ${activeTab.label.toLowerCase()}`} error={error} /> : null}
      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
        {data.map((project) => (
          <Card className="overflow-hidden shadow-panel" key={project.id}>
            <CardHeader className="p-3">
              <div className="flex items-center justify-between gap-3">
                <Badge variant={statusVariant(project.risk)}>{project.risk}</Badge>
                <span className="text-xs text-muted-foreground">{formatDate(project.due_date)}</span>
              </div>
              <CardTitle>{project.title}</CardTitle>
              <CardDescription>
                {project.school} · {project.incubator}
              </CardDescription>
            </CardHeader>
            <CardContent className="grid gap-3 p-3 pt-0">
              <div className="grid grid-cols-[minmax(0,1fr)_42px] items-center gap-3">
                <Progress value={project.score} />
                <strong>{project.score}</strong>
              </div>
              <dl className="grid gap-2 text-sm">
                <Meta label="Stage" value={project.stage} />
                <Meta label="Mentor" value={project.mentor} />
                <Meta label="Next" value={project.next_action} />
              </dl>
            </CardContent>
          </Card>
        ))}
      </div>
    </Section>
  );
}
