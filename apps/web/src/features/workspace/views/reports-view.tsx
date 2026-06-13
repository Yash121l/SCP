import { Badge, Button, Card, CardContent, Progress } from "@scp/ui";
import { LoadingState } from "../../../components/common/loading-state";
import { Section } from "../../../components/common/section";
import { api } from "../../../lib/api";
import { statusVariant } from "../../../lib/status";
import { useAsyncData } from "../../../hooks/use-async-data";
import type { Report, Role } from "../../../types";
import type { WorkspaceTab } from "../workspace.types";

export function ReportsView({
  activeTab,
  role,
  search,
}: {
  activeTab: WorkspaceTab;
  role: Role;
  search: string;
}) {
  const { data, error, loading, setData } = useAsyncData<Report[]>(
    () => api.reports(role.id, search).then((result) => result.reports),
    [role.id, search],
    [],
  );
  const canRun = role.permissions.includes("reports");

  async function runReport(reportId: string) {
    await api.runReport(role.id, reportId);
    const next = await api.reports(role.id, search);
    setData(next.reports);
  }

  return (
    <Section title={activeTab.label} description={activeTab.description}>
      {loading ? <LoadingState label={`Loading ${activeTab.label.toLowerCase()}`} error={error} /> : null}
      <div className="grid gap-2">
        {data.map((report) => (
          <Card className="shadow-panel" key={report.id}>
            <CardContent className="grid gap-3 p-3 md:grid-cols-[minmax(0,1fr)_220px_auto] md:items-center">
              <div>
                <strong className="block">{report.name}</strong>
                <span className="text-sm text-muted-foreground">
                  {report.cadence} · {report.owner} · generated {report.generated_count}x
                </span>
              </div>
              <div className="grid gap-2">
                <Progress value={report.coverage} />
                <span className="text-xs text-muted-foreground">{report.coverage}% coverage</span>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant={statusVariant(report.status)}>{report.status}</Badge>
                {canRun ? (
                  <Button onClick={() => runReport(report.id)} size="sm" variant="outline">
                    Generate
                  </Button>
                ) : null}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </Section>
  );
}
