import {
  Badge,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@scp/ui";
import { LoadingState } from "../../../components/common/loading-state";
import { Section } from "../../../components/common/section";
import { api } from "../../../lib/api";
import { formatNumber } from "../../../lib/format";
import { statusVariant } from "../../../lib/status";
import { useAsyncData } from "../../../hooks/use-async-data";
import type { Institution, Role } from "../../../types";
import type { WorkspaceTab } from "../workspace.types";

export function InstitutionsView({
  activeTab,
  role,
  search,
}: {
  activeTab: WorkspaceTab;
  role: Role;
  search: string;
}) {
  const { data, error, loading } = useAsyncData<Institution[]>(
    () => api.institutions(role.id, search).then((result) => result.institutions),
    [role.id, search],
    [],
  );

  return (
    <Section title={activeTab.label} description={activeTab.description}>
      {loading ? <LoadingState label={`Loading ${activeTab.label.toLowerCase()}`} error={error} /> : null}
      <div className="overflow-hidden rounded-lg border bg-card shadow-panel">
        <div className="overflow-x-auto">
          <Table className="min-w-[920px]">
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Region</TableHead>
                <TableHead>Owner</TableHead>
                <TableHead>Students</TableHead>
                <TableHead>Projects</TableHead>
                <TableHead>Report</TableHead>
                <TableHead>Risk</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.map((item) => (
                <TableRow key={item.id}>
                  <TableCell className="font-medium">{item.name}</TableCell>
                  <TableCell>{item.type}</TableCell>
                  <TableCell>{item.region}</TableCell>
                  <TableCell>{item.owner}</TableCell>
                  <TableCell>{formatNumber(item.students)}</TableCell>
                  <TableCell>{item.projects}</TableCell>
                  <TableCell>
                    <Badge variant={statusVariant(item.report_status)}>{item.report_status}</Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant={statusVariant(item.risk)}>{item.risk}</Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>
    </Section>
  );
}
