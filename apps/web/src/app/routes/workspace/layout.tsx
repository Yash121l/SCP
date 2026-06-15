import { useEffect } from "react";
import { Outlet } from "react-router-dom";
import { Badge } from "@scp/ui";
import { AppSidebar } from "../../../components/navigation/app-sidebar.js";
import { Topbar } from "../../../components/navigation/topbar.js";
import { useAuth } from "../../../features/auth/auth-context.js";
import { WorkspaceDataProvider, useWorkspaceDataState } from "../../../features/workspace/workspace-data.js";

export function WorkspaceLayoutRoute() {
  const { session, signOut } = useAuth();

  if (!session) {
    return null;
  }

  return (
    <WorkspaceDataProvider session={session}>
      <WorkspaceShell onLogout={signOut} />
    </WorkspaceDataProvider>
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
          <div className="loading-state">Loading programme workspace</div>
        ) : error ? (
          <div className="loading-state">{error}</div>
        ) : (
          <Outlet />
        )}
      </main>
    </div>
  );
}
