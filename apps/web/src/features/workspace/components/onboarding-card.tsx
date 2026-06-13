import { Badge, Card, CardContent, CardDescription, CardHeader, CardTitle, cn } from "@scp/ui";
import type { RoleWorkspace } from "../workspace.types";
import { statusVariant } from "../../../lib/status";

export function OnboardingCard({ workspace }: { workspace: RoleWorkspace }) {
  return (
    <Card className="shadow-panel">
      <CardHeader>
        <CardDescription>Onboarding</CardDescription>
        <CardTitle>Readiness checklist</CardTitle>
      </CardHeader>
      <CardContent className="grid gap-3">
        {workspace.onboarding.map((item, index) => (
          <div
            className="grid grid-cols-[28px_minmax(0,1fr)_auto] gap-3 rounded-lg border bg-muted/20 p-3"
            key={item.label}
          >
            <span
              className={cn(
                "grid h-7 w-7 place-items-center rounded-full border font-mono text-xs",
                item.status === "done" && "bg-emerald-500/10 text-emerald-700 dark:text-emerald-200",
                item.status === "active" && "bg-amber-500/10 text-amber-700 dark:text-amber-200",
              )}
            >
              {index + 1}
            </span>
            <div>
              <strong className="block">{item.label}</strong>
              <span className="text-sm text-muted-foreground">{item.detail}</span>
            </div>
            <Badge variant={statusVariant(item.status)}>{item.status}</Badge>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
