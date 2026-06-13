import { Menu, Moon, Search, Sun } from "lucide-react";
import { useLocation } from "react-router-dom";
import { Button, Input, cn } from "@scp/ui";
import { roleAccent } from "../../../config/role-presentation";
import type { Role } from "../../../types";
import type { RoleWorkspace, Theme, WorkspaceTab } from "../workspace.types";

export function Topbar({
  activeTab,
  onMenu,
  onSearch,
  role,
  search,
  theme,
  toggleTheme,
  workspace,
}: {
  activeTab: WorkspaceTab;
  onMenu: () => void;
  onSearch: (value: string) => void;
  role: Role;
  search: string;
  theme: Theme;
  toggleTheme: () => void;
  workspace: RoleWorkspace;
}) {
  const location = useLocation();

  return (
    <header className="z-20 border-b bg-card/82 px-3 py-2 backdrop-blur-xl sm:px-4">
      <div className="flex w-full flex-wrap items-center gap-2">
        <Button
          aria-label="Open menu"
          className="lg:hidden"
          data-testid="mobile-menu-button"
          onClick={onMenu}
          size="icon"
          variant="outline"
        >
          <Menu className="size-4" />
        </Button>
        <div className="mr-auto min-w-0">
          <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.18em] text-primary">
            {workspace.commandLabel} · {activeTab.eyebrow}
          </p>
          <div className="flex min-w-0 items-center gap-2">
            <h2 className="truncate text-base font-semibold tracking-normal">{activeTab.label}</h2>
            <span className="hidden truncate font-mono text-[10px] text-muted-foreground md:block">
              {location.pathname}
            </span>
          </div>
        </div>
        <label className="relative order-last w-full sm:order-none sm:w-[280px]">
          <Search className="pointer-events-none absolute left-2.5 top-2 h-4 w-4 text-muted-foreground" />
          <Input
            className="pl-8"
            data-testid="workspace-search"
            onChange={(event) => onSearch(event.target.value)}
            placeholder={`Search ${activeTab.label.toLowerCase()}`}
            type="search"
            value={search}
          />
        </label>
        <Button aria-label="Toggle dark mode" data-testid="theme-toggle" onClick={toggleTheme} size="icon" variant="outline">
          {theme === "dark" ? <Sun /> : <Moon />}
        </Button>
        <div
          className={cn(
            "grid min-w-[172px] grid-cols-[28px_minmax(0,1fr)] items-center gap-2 rounded-lg border bg-background p-1 pr-2",
            roleAccent[role.accent] || roleAccent.teal,
          )}
          data-testid="role-chip"
        >
          <span className="grid size-7 place-items-center rounded-md bg-card/80 text-[10px] font-black">
            {role.short_label}
          </span>
          <strong className="truncate text-sm">{role.name}</strong>
        </div>
      </div>
    </header>
  );
}
