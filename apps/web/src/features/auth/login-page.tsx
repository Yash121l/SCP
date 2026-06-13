import { useState } from "react";
import { Database, Loader2, Moon, RouteIcon, ShieldCheck, Sun, Users } from "lucide-react";
import { Badge, Button, Card, CardContent, CardDescription, CardHeader, CardTitle, cn } from "@scp/ui";
import { roleAccent, roleIcon } from "../../config/role-presentation";
import { workspaceFor } from "../../config/workspaces";
import type { Role } from "../../types";
import type { Theme } from "../workspace/workspace.types";

export function LoginPage({
  bootError,
  onLogin,
  roles,
  theme,
  toggleTheme,
}: {
  bootError: string | null;
  onLogin: (roleId: string) => Promise<void>;
  roles: Role[];
  theme: Theme;
  toggleTheme: () => void;
}) {
  const [pendingRole, setPendingRole] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  return (
    <main className="flex min-h-dvh flex-col bg-background text-foreground">
      <header className="flex h-12 items-center justify-between border-b bg-card/80 px-4 backdrop-blur">
        <div className="flex min-w-0 items-center gap-2.5">
          <div className="grid size-8 place-items-center rounded-lg bg-foreground text-[11px] font-black text-background">
            SCP
          </div>
          <div className="min-w-0">
            <strong className="block truncate text-sm leading-4">Central Programme Portal</strong>
            <span className="block truncate font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
              /login · demo access
            </span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant={roles.length > 0 ? "success" : "warning"}>
            {roles.length > 0 ? `${roles.length} seeded roles` : "API pending"}
          </Badge>
          <Button
            aria-label="Toggle theme"
            data-testid="login-theme-toggle"
            onClick={toggleTheme}
            size="icon"
            variant="outline"
          >
            {theme === "dark" ? <Sun /> : <Moon />}
          </Button>
        </div>
      </header>

      <div className="mx-auto grid w-full max-w-6xl flex-1 gap-4 px-4 py-4 lg:grid-cols-[240px_minmax(0,1fr)_300px]">
        <aside className="hidden min-h-0 rounded-lg border bg-card/70 p-3 lg:block">
          <div className="mb-3 flex items-center gap-2">
            <RouteIcon className="size-4 text-primary" />
            <h1 className="text-sm font-semibold">Route map</h1>
          </div>
          <div className="grid gap-1.5 text-xs">
            {["/login", "/workspaces/:roleId", "/workspaces/:roleId/:tabId"].map((path) => (
              <div className="rounded-md border bg-background px-2 py-1.5 font-mono text-muted-foreground" key={path}>
                {path}
              </div>
            ))}
          </div>
          <div className="mt-4 rounded-lg border bg-background p-3">
            <div className="flex items-center gap-2 text-xs font-medium">
              <ShieldCheck className="size-3.5 text-primary" />
              Route locks
            </div>
            <p className="mt-2 text-xs leading-5 text-muted-foreground">
              Workspace routes are scoped to the signed-in role and redirect invalid tabs to the
              first allowed module.
            </p>
          </div>
        </aside>

        <section className="min-h-0 rounded-lg border bg-card/85 shadow-panel">
          <div className="flex items-start justify-between gap-4 border-b p-4">
            <div>
              <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.18em] text-primary">
                One-click login
              </p>
              <h2 className="mt-1 text-2xl font-semibold tracking-normal">Choose demo workspace</h2>
              <p className="mt-1 max-w-xl text-sm text-muted-foreground">
                Select a seeded role. The next screen uses a real route like
                <span className="font-mono"> /workspaces/student/studio</span>.
              </p>
            </div>
          </div>

          {bootError || error ? (
            <div className="m-4 rounded-lg border border-amber-500/30 bg-amber-500/10 p-3 text-sm text-amber-700 dark:text-amber-200">
              {error || bootError}. Start the stack with <strong>npm run compose:up</strong>.
            </div>
          ) : null}

          <div className="grid gap-2 p-3 sm:grid-cols-2">
            {roles.map((item) => {
              const Icon = roleIcon[item.id] || Users;
              const pending = pendingRole === item.id;
              const preview = workspaceFor(item);
              return (
                <button
                  className="group grid grid-cols-[36px_minmax(0,1fr)_auto] items-center gap-2 rounded-lg border bg-background/80 p-2 text-left transition hover:border-primary/35 hover:bg-accent/60"
                  data-testid={`login-role-${item.id}`}
                  disabled={pendingRole !== null}
                  key={item.id}
                  onClick={() => {
                    setPendingRole(item.id);
                    setError(null);
                    onLogin(item.id)
                      .catch((err: unknown) => {
                        setError(err instanceof Error ? err.message : "Login failed");
                      })
                      .finally(() => setPendingRole(null));
                  }}
                  type="button"
                >
                  <span
                    className={cn(
                      "grid size-9 place-items-center rounded-md border",
                      roleAccent[item.accent] || roleAccent.teal,
                    )}
                  >
                    <Icon className="size-4" />
                  </span>
                  <span className="min-w-0">
                    <strong className="block truncate text-sm">{item.label}</strong>
                    <small className="block truncate text-xs text-muted-foreground">{preview.headline}</small>
                  </span>
                  {pending ? (
                    <Loader2 className="size-4 animate-spin text-muted-foreground" />
                  ) : (
                    <Badge variant="outline">
                      {preview.commandLabel}
                    </Badge>
                  )}
                </button>
              );
            })}
          </div>
        </section>

        <aside className="grid content-start gap-3">
          <Card className="shadow-panel">
            <CardHeader className="p-4">
              <div className="mb-2 flex items-center gap-2">
                <Database className="size-4 text-primary" />
                <CardTitle className="text-sm">Seeded MVP</CardTitle>
              </div>
              <CardDescription>
                Postgres-backed demo data for roles, institutions, projects, approvals, reports,
                resources, and audit events.
              </CardDescription>
            </CardHeader>
          </Card>
          <Card className="shadow-panel">
            <CardContent className="grid gap-2 p-3">
              {[
                ["RBAC", "Role-scoped route guards"],
                ["Data", "API-backed seeded records"],
                ["UI", "Dark-first compact shell"],
              ].map(([label, description]) => (
                <div className="rounded-md border bg-background p-2" key={label}>
                  <strong className="block text-sm">{label}</strong>
                  <small className="text-muted-foreground">{description}</small>
                </div>
              ))}
            </CardContent>
          </Card>
        </aside>
      </div>
    </main>
  );
}
