import { LogOut, X } from "lucide-react";
import { Button, Card, CardDescription, CardHeader, CardTitle, Progress, cn } from "@scp/ui";
import { roleAccent } from "../../../config/role-presentation";
import type { Role } from "../../../types";
import type { RoleWorkspace } from "../workspace.types";

export function Sidebar({
  activeView,
  onClose,
  onLogout,
  onNavigate,
  open,
  role,
  workspace,
}: {
  activeView: string;
  onClose: () => void;
  onLogout: () => void;
  onNavigate: (view: string) => void;
  open: boolean;
  role: Role;
  workspace: RoleWorkspace;
}) {
  return (
    <aside
      className={cn(
        "app-sidebar-panel fixed inset-y-0 z-40 flex w-[260px] flex-col border-r bg-card/95 shadow-2xl shadow-black/10 backdrop-blur-xl transition-[left] lg:sticky lg:top-0 lg:h-dvh lg:shadow-none",
      )}
      data-open={open ? "true" : "false"}
      style={{ left: open ? "0px" : "var(--app-sidebar-left)" }}
    >
      <div className="flex h-12 items-center justify-between border-b px-3">
        <div className="flex min-w-0 items-center gap-3">
          <div className="grid size-8 place-items-center rounded-lg bg-foreground text-[11px] font-black text-background">
            SCP
          </div>
          <div className="min-w-0">
            <strong className="block truncate text-sm leading-4">{workspace.commandLabel} Workspace</strong>
            <span className="block truncate font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
              {role.organization}
            </span>
          </div>
        </div>
        <Button aria-label="Close menu" className="lg:hidden" onClick={onClose} size="icon" variant="ghost">
          <X className="h-4 w-4" />
        </Button>
      </div>

      <nav className="grid gap-1 p-2">
        {workspace.nav.map((item) => {
          const Icon = item.icon;
          const active = activeView === item.id;
          return (
            <button
              className={cn(
                "group flex h-9 items-center gap-2 rounded-lg px-2 text-left text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground",
                active && "bg-accent text-foreground ring-1 ring-border",
              )}
              data-testid={`nav-${item.id}`}
              key={item.id}
              onClick={() => onNavigate(item.id)}
              type="button"
            >
              <span
                className={cn(
                  "grid size-7 place-items-center rounded-md border bg-background",
                  active && "border-primary/30 text-primary",
                )}
              >
                <Icon className="size-3.5" />
              </span>
              <span className="min-w-0">
                <span className="block truncate leading-4">{item.label}</span>
                <span className="block truncate font-mono text-[9px] uppercase tracking-wider text-muted-foreground/70">
                  {item.eyebrow}
                </span>
              </span>
            </button>
          );
        })}
      </nav>

      <div className="mt-auto grid gap-2 p-2">
        <Card className="overflow-hidden shadow-none">
          <CardHeader className="p-3">
            <div className="flex items-center gap-2">
              <span
                className={cn(
                  "grid size-8 place-items-center rounded-md border text-xs font-semibold",
                  roleAccent[role.accent] || roleAccent.teal,
                )}
              >
                {role.short_label}
              </span>
              <div className="min-w-0">
                <CardTitle className="truncate">{role.name}</CardTitle>
                <CardDescription className="truncate">{role.label}</CardDescription>
              </div>
            </div>
            <Progress value={workspace.profileCompleteness} />
            <CardDescription>{workspace.profileCompleteness}% profile readiness</CardDescription>
          </CardHeader>
        </Card>
        <Button onClick={onLogout} variant="outline">
          <LogOut className="h-4 w-4" />
          Switch role
        </Button>
      </div>
    </aside>
  );
}
