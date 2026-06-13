import { LifeBuoy } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@scp/ui";
import { Section } from "../../../components/common/section";
import type { Role } from "../../../types";
import type { RoleWorkspace } from "../workspace.types";
import { OnboardingCard } from "../components/onboarding-card";

export function OnboardingView({ role, workspace }: { role: Role; workspace: RoleWorkspace }) {
  return (
    <Section
      title={`${role.label} onboarding`}
      description="Activation checklist, readiness, and next role-specific setup steps."
    >
      <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_380px]">
        <OnboardingCard workspace={workspace} />
        <Card className="shadow-panel">
          <CardHeader>
            <CardDescription>Next setup</CardDescription>
            <CardTitle>What this role needs before rollout</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-3">
            {[
              "Confirm real user hierarchy and organization scope.",
              "Attach required document and export permissions.",
              "Run a first approval, report, or project update as the role.",
            ].map((item) => (
              <div className="flex gap-3 rounded-lg border bg-muted/20 p-3" key={item}>
                <LifeBuoy className="mt-0.5 h-4 w-4 text-primary" />
                <span className="text-sm text-muted-foreground">{item}</span>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </Section>
  );
}
