import type { ReactNode } from "react";
import { Sidebar } from "./sidebar";
import { Topbar } from "./topbar";
import type { Role } from "../../../types";
import type { RoleWorkspace, Theme, WorkspaceTab } from "../workspace.types";

export function AppShell({
  activeTab,
  children,
  onLogout,
  onMenu,
  onNavigate,
  onSearch,
  onSidebarClose,
  role,
  search,
  sidebarOpen,
  theme,
  toggleTheme,
  workspace,
}: {
  activeTab: WorkspaceTab;
  children: ReactNode;
  onLogout: () => void;
  onMenu: () => void;
  onNavigate: (view: string) => void;
  onSearch: (value: string) => void;
  onSidebarClose: () => void;
  role: Role;
  search: string;
  sidebarOpen: boolean;
  theme: Theme;
  toggleTheme: () => void;
  workspace: RoleWorkspace;
}) {
  return (
    <div className="h-dvh overflow-hidden bg-background text-foreground lg:grid lg:grid-cols-[260px_minmax(0,1fr)]">
      <Sidebar
        activeView={activeTab.id}
        onClose={onSidebarClose}
        onLogout={onLogout}
        onNavigate={onNavigate}
        open={sidebarOpen}
        role={role}
        workspace={workspace}
      />
      {sidebarOpen ? (
        <button
          aria-label="Close menu overlay"
          className="fixed inset-0 z-30 bg-slate-950/50 backdrop-blur-sm lg:hidden"
          onClick={onSidebarClose}
          type="button"
        />
      ) : null}
      <main className="flex min-w-0 flex-col overflow-hidden">
        <Topbar
          activeTab={activeTab}
          onMenu={onMenu}
          onSearch={onSearch}
          role={role}
          search={search}
          theme={theme}
          toggleTheme={toggleTheme}
          workspace={workspace}
        />
        <div className="min-h-0 flex-1 overflow-auto px-4 py-4 sm:px-5">{children}</div>
      </main>
    </div>
  );
}
