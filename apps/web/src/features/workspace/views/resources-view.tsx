import { Badge, Card, CardContent, CardDescription, CardHeader, CardTitle } from "@scp/ui";
import { LoadingState } from "../../../components/common/loading-state";
import { Section } from "../../../components/common/section";
import { api } from "../../../lib/api";
import { formatDate } from "../../../lib/format";
import { useAsyncData } from "../../../hooks/use-async-data";
import type { ResourceDoc, Role } from "../../../types";
import type { WorkspaceTab } from "../workspace.types";

export function ResourcesView({
  activeTab,
  role,
  search,
}: {
  activeTab: WorkspaceTab;
  role: Role;
  search: string;
}) {
  const { data, error, loading } = useAsyncData<ResourceDoc[]>(
    () => api.resources(role.id, search).then((result) => result.resources),
    [role.id, search],
    [],
  );

  return (
    <Section title={activeTab.label} description={activeTab.description}>
      {loading ? <LoadingState label={`Loading ${activeTab.label.toLowerCase()}`} error={error} /> : null}
      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        {data.map((doc) => (
          <Card className="shadow-panel" key={doc.id}>
            <CardHeader className="p-3">
              <Badge variant="secondary">{doc.type}</Badge>
              <CardTitle>{doc.title}</CardTitle>
              <CardDescription>{doc.audience}</CardDescription>
            </CardHeader>
            <CardContent className="flex flex-wrap gap-2 p-3 pt-0 text-xs text-muted-foreground">
              <Badge variant="outline">{doc.version}</Badge>
              <Badge variant="outline">{doc.access}</Badge>
              <Badge variant="outline">{formatDate(doc.updated_at)}</Badge>
            </CardContent>
          </Card>
        ))}
      </div>
    </Section>
  );
}
