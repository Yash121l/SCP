import { useEffect } from "react";
import { Outlet } from "react-router-dom";
import { Badge } from "@scp/ui";
import { AppSidebar } from "../../../components/navigation/app-sidebar.js";
import { Topbar } from "../../../components/navigation/topbar.js";
import { useAuth } from "../../../features/auth/auth-context.js";
import { WorkspaceDataProvider, useWorkspaceDataState } from "../../../features/workspace/workspace-data.js";
import { MobileSidebarProvider } from "../../../components/navigation/mobile-sidebar-context.js";
import { CommandPaletteProvider } from "../../../components/navigation/command-palette-context.js";
import { CommandPalette } from "../../../components/navigation/command-palette.js";

export function WorkspaceLayoutRoute() {
  const { session, signOut } = useAuth();

  if (!session) {
    return null;
  }

  return (
    <MobileSidebarProvider>
      <CommandPaletteProvider>
        <WorkspaceDataProvider session={session}>
          <WorkspaceShell onLogout={signOut} />
          <CommandPalette />
        </WorkspaceDataProvider>
      </CommandPaletteProvider>
    </MobileSidebarProvider>
  );
}

function WorkspaceShell({ onLogout }: { onLogout: () => void }) {
  const { error, isLoading } = useWorkspaceDataState();
  const { session } = useAuth();
  const hasAuthError = error === "Authentication required" || error === "Invalid or expired session";

  useEffect(() => {
    if (hasAuthError) {
      onLogout();
    }
  }, [hasAuthError, onLogout]);

  if (!session) {
    return null;
  }

  return (
    <div className="app-shell">
      <AppSidebar session={session} />

      <main className="workspace">
        <Topbar user={session.user} onLogout={onLogout} />

        {error && (
          <div className="banner" role="status">
            <span>{error}</span>
            <Badge tone="amber">Check API</Badge>
          </div>
        )}

        {isLoading || hasAuthError ? (
          <div className="workspace-scroll dashboard-skeleton">
            <div className="dashboard-skeleton-grid">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="skeleton skeleton-kpi" />
              ))}
            </div>
            <div className="dashboard-skeleton-body">
              <div style={{ display: 'grid', gap: '20px' }}>
                <div className="ui-panel" style={{ minHeight: '300px' }}>
                  <div className="skeleton skeleton-title" />
                  <div className="skeleton skeleton-text" />
                  <div className="skeleton skeleton-text" />
                  <div className="skeleton skeleton-text" style={{ width: '80%' }} />
                </div>
              </div>
              <div style={{ display: 'grid', gap: '12px' }}>
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="ui-panel" style={{ minHeight: '150px' }}>
                    <div className="skeleton skeleton-title" style={{ width: '40%' }} />
                    <div className="skeleton skeleton-text" />
                    <div className="skeleton skeleton-text" style={{ width: '70%' }} />
                  </div>
                ))}
              </div>
            </div>
          </div>
        ) : error ? (
          <div className="loading-state">{error}</div>
        ) : (
          <Outlet />
        )}
      </main>
    </div>
  );
}
