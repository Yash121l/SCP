import { UserRound } from "lucide-react";
import { Badge, Card, CardContent, CardDescription, CardHeader, CardTitle, Progress, cn } from "@scp/ui";
import { Meta } from "../../../components/common/meta";
import { Section } from "../../../components/common/section";
import { roleAccent, roleIcon } from "../../../config/role-presentation";
import type { Role } from "../../../types";
import type { RoleWorkspace } from "../workspace.types";

export function ProfileView({ role, workspace }: { role: Role; workspace: RoleWorkspace }) {
  const Icon = roleIcon[role.id] || UserRound;

  return (
    <Section title={`${role.label} profile`} description={workspace.persona}>
      <div className="grid gap-4 xl:grid-cols-[420px_minmax(0,1fr)]">
        <Card className="overflow-hidden shadow-panel">
          <CardHeader className="bg-muted/30">
            <div className="flex items-center gap-4">
              <span
                className={cn(
                  "grid size-12 place-items-center rounded-lg border",
                  roleAccent[role.accent] || roleAccent.teal,
                )}
              >
                <Icon className="size-5" />
              </span>
              <div>
                <CardTitle className="text-lg">{role.name}</CardTitle>
                <CardDescription>{role.organization}</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="grid gap-4 pt-5">
            <Meta label="Role" value={role.label} />
            <Meta label="Scope" value={role.scope} />
            <Meta label="Workspace" value={workspace.commandLabel} />
            <div>
              <div className="mb-2 flex justify-between text-sm">
                <span className="text-muted-foreground">Profile readiness</span>
                <strong>{workspace.profileCompleteness}%</strong>
              </div>
              <Progress value={workspace.profileCompleteness} />
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-panel">
          <CardHeader>
            <CardDescription>Access model</CardDescription>
            <CardTitle>Permissions and responsibilities</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 md:grid-cols-2">
            <div className="rounded-lg border bg-muted/20 p-3">
              <h3 className="font-semibold">Permissions</h3>
              <div className="mt-3 flex flex-wrap gap-2">
                {role.permissions.map((permission) => (
                  <Badge key={permission} variant="outline">
                    {permission}
                  </Badge>
                ))}
              </div>
            </div>
            <div className="rounded-lg border bg-muted/20 p-3">
              <h3 className="font-semibold">Operating brief</h3>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">{workspace.subline}</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </Section>
  );
}
