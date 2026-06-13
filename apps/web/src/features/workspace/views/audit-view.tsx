import { Card, CardContent } from "@scp/ui";
import { LoadingState } from "../../../components/common/loading-state";
import { Section } from "../../../components/common/section";
import { api } from "../../../lib/api";
import { useAsyncData } from "../../../hooks/use-async-data";
import type { AuditEvent, Role } from "../../../types";
import type { WorkspaceTab } from "../workspace.types";

export function AuditView({ activeTab, role }: { activeTab: WorkspaceTab; role: Role }) {
  const { data, error, loading } = useAsyncData<AuditEvent[]>(
    () => api.audit(role.id).then((result) => result.events),
    [role.id],
    [],
  );

  return (
    <Section title={activeTab.label} description={activeTab.description}>
      {loading ? <LoadingState label="Loading audit events" error={error} /> : null}
      <Card className="shadow-panel">
        <CardContent className="grid gap-3 p-4">
          {data.map((event) => (
            <div
              className="grid grid-cols-[18px_minmax(0,1fr)_auto] gap-3 rounded-lg border bg-muted/20 p-3"
              key={event.id}
            >
              <span className="mt-1.5 h-2.5 w-2.5 rounded-full bg-primary" />
              <div>
                <strong className="block">{event.actor}</strong>
                <span className="text-sm text-muted-foreground">{event.event}</span>
              </div>
              <small className="text-right text-muted-foreground">
                {event.module}
                <br />
                {new Date(event.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
              </small>
            </div>
          ))}
        </CardContent>
      </Card>
    </Section>
  );
}
