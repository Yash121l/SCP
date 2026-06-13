import { Badge, Card, CardContent, CardDescription, CardHeader, CardTitle } from "@scp/ui";
import { LoadingState } from "../../../components/common/loading-state";
import { Section } from "../../../components/common/section";
import { api } from "../../../lib/api";
import { useAsyncData } from "../../../hooks/use-async-data";
import type { Approval, Role } from "../../../types";
import type { WorkspaceTab } from "../workspace.types";
import { ApprovalList } from "../components/approval-list";

export function GovernanceView({
  activeTab,
  role,
  search,
}: {
  activeTab: WorkspaceTab;
  role: Role;
  search: string;
}) {
  const { data, error, loading, setData } = useAsyncData<Approval[]>(
    () => api.governance(role.id, search).then((result) => result.approvals),
    [role.id, search],
    [],
  );

  async function approve(id: string) {
    await api.approve(role.id, id);
    setData(data.filter((approval) => approval.id !== id));
  }

  return (
    <Section title={activeTab.label} description={activeTab.description}>
      {loading ? <LoadingState label={`Loading ${activeTab.label.toLowerCase()}`} error={error} /> : null}
      <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_380px]">
        <Card className="shadow-panel">
          <CardHeader>
            <CardDescription>{data.length} open workflow items</CardDescription>
            <CardTitle>Approval queue</CardTitle>
          </CardHeader>
          <CardContent>
            <ApprovalList approvals={data} onApprove={approve} role={role} />
          </CardContent>
        </Card>
        <Card className="shadow-panel">
          <CardHeader>
            <CardDescription>Meeting pack</CardDescription>
            <CardTitle>Council action tracker</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-3">
            {[
              ["Decision", "Approve pilot-to-scale readiness criteria", "Council"],
              ["Action", "Close West hub procurement blocker", "PMU"],
              ["Review", "Validate student data privacy checklist", "IT Tool Team"],
              ["Record", "Publish signed minutes v3", "Secretariat"],
            ].map(([type, text, owner]) => (
              <div className="border-l-2 border-primary pl-3" key={text}>
                <Badge variant="outline">{type}</Badge>
                <strong className="mt-2 block">{text}</strong>
                <small className="text-muted-foreground">{owner}</small>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </Section>
  );
}
