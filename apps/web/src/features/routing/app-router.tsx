import type { ReactNode } from "react";
import { Navigate, Route, Routes, useLocation, useNavigate, useParams, useSearchParams } from "react-router-dom";
import { AlertTriangle, LockKeyhole, RouteIcon } from "lucide-react";
import { Button, Card, CardContent, CardDescription, CardHeader, CardTitle } from "@scp/ui";
import { AppShell } from "../workspace/layout/app-shell";
import { WorkspaceRouter } from "../workspace/workspace-router";
import { LoginPage } from "../auth/login-page";
import { workspaceFor } from "../../config/workspaces";
import { workspacePath } from "./paths";
import type { Role } from "../../types";
import type { Theme } from "../workspace/workspace.types";

export function AppRouter({
  bootError,
  login,
  logout,
  onBeforeNavigate,
  onMenu,
  onSearch,
  onSidebarClose,
  role,
  roles,
  rolesLoaded,
  search,
  sidebarOpen,
  theme,
  toggleTheme,
}: {
  bootError: string | null;
  login: (roleId: string) => Promise<Role>;
  logout: () => void;
  onBeforeNavigate: () => void;
  onMenu: () => void;
  onSearch: (value: string) => void;
  onSidebarClose: () => void;
  role: Role | null;
  roles: Role[];
  rolesLoaded: boolean;
  search: string;
  sidebarOpen: boolean;
  theme: Theme;
  toggleTheme: () => void;
}) {
  return (
    <Routes>
      <Route
        path="/"
        element={rolesLoaded ? <Navigate to={role ? workspacePath(role) : "/login"} replace /> : <RouteLoading />}
      />
      <Route
        path="/login"
        element={
          <LoginRoute
            bootError={bootError}
            login={login}
            roles={roles}
            theme={theme}
            toggleTheme={toggleTheme}
          />
        }
      />
      <Route
        path="/workspaces/:roleId"
        element={<WorkspaceIndexRoute role={role} roles={roles} rolesLoaded={rolesLoaded} />}
      />
      <Route
        path="/workspaces/:roleId/:tabId"
        element={
          <WorkspaceGuardedRoute
            logout={logout}
            onBeforeNavigate={onBeforeNavigate}
            onMenu={onMenu}
            onSearch={onSearch}
            onSidebarClose={onSidebarClose}
            role={role}
            roles={roles}
            rolesLoaded={rolesLoaded}
            search={search}
            sidebarOpen={sidebarOpen}
            theme={theme}
            toggleTheme={toggleTheme}
          />
        }
      />
      <Route path="*" element={<RouteFallback />} />
    </Routes>
  );
}

function LoginRoute({
  bootError,
  login,
  roles,
  theme,
  toggleTheme,
}: {
  bootError: string | null;
  login: (roleId: string) => Promise<Role>;
  roles: Role[];
  theme: Theme;
  toggleTheme: () => void;
}) {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const next = params.get("next");

  return (
    <LoginPage
      bootError={bootError}
      onLogin={async (roleId) => {
        const nextRole = await login(roleId);
        const safeNext = next?.startsWith(`/workspaces/${nextRole.id}/`) ? next : workspacePath(nextRole);
        navigate(safeNext, { replace: true });
      }}
      roles={roles}
      theme={theme}
      toggleTheme={toggleTheme}
    />
  );
}

function WorkspaceIndexRoute({
  role,
  roles,
  rolesLoaded,
}: {
  role: Role | null;
  roles: Role[];
  rolesLoaded: boolean;
}) {
  const { roleId } = useParams();
  const matchedRole = roles.find((item) => item.id === roleId);

  if (!rolesLoaded) return <RouteLoading />;
  if (!role) return <LoginRedirect />;
  if (!matchedRole) return <RouteFallback />;
  if (role.id !== matchedRole.id) return <LockedRoute requestedRole={matchedRole} role={role} />;

  return <Navigate to={workspacePath(role)} replace />;
}

function WorkspaceGuardedRoute({
  logout,
  onBeforeNavigate,
  onMenu,
  onSearch,
  onSidebarClose,
  role,
  roles,
  rolesLoaded,
  search,
  sidebarOpen,
  theme,
  toggleTheme,
}: {
  logout: () => void;
  onBeforeNavigate: () => void;
  onMenu: () => void;
  onSearch: (value: string) => void;
  onSidebarClose: () => void;
  role: Role | null;
  roles: Role[];
  rolesLoaded: boolean;
  search: string;
  sidebarOpen: boolean;
  theme: Theme;
  toggleTheme: () => void;
}) {
  const navigate = useNavigate();
  const { roleId, tabId } = useParams();
  const requestedRole = roles.find((item) => item.id === roleId);

  if (!rolesLoaded) return <RouteLoading />;
  if (!role) return <LoginRedirect />;
  if (!requestedRole) return <RouteFallback />;
  if (role.id !== requestedRole.id) return <LockedRoute requestedRole={requestedRole} role={role} />;

  const workspace = workspaceFor(role);
  const activeTab = workspace.nav.find((item) => item.id === tabId);
  if (!activeTab) return <Navigate to={workspacePath(role)} replace />;

  return (
    <AppShell
      activeTab={activeTab}
      onLogout={() => {
        logout();
        navigate("/login", { replace: true });
      }}
      onMenu={onMenu}
      onNavigate={(nextView) => {
        onBeforeNavigate();
        navigate(workspacePath(role, nextView));
      }}
      onSearch={onSearch}
      onSidebarClose={onSidebarClose}
      role={role}
      search={search}
      sidebarOpen={sidebarOpen}
      theme={theme}
      toggleTheme={toggleTheme}
      workspace={workspace}
    >
      <WorkspaceRouter activeTab={activeTab} role={role} search={search} workspace={workspace} />
    </AppShell>
  );
}

function LoginRedirect() {
  const location = useLocation();
  return <Navigate to={`/login?next=${encodeURIComponent(location.pathname)}`} replace />;
}

function LockedRoute({ requestedRole, role }: { requestedRole: Role; role: Role }) {
  return (
    <RouteShell>
      <Card className="w-full max-w-md">
        <CardHeader>
          <LockKeyhole className="mb-2 h-5 w-5 text-muted-foreground" />
          <CardTitle>Workspace locked</CardTitle>
          <CardDescription>
            You are signed in as {role.label}. This route belongs to {requestedRole.label}.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex gap-2">
          <Button onClick={() => window.location.assign(workspacePath(role))} size="sm">
            Return to workspace
          </Button>
          <Button onClick={() => window.location.assign("/login")} size="sm" variant="outline">
            Switch role
          </Button>
        </CardContent>
      </Card>
    </RouteShell>
  );
}

function RouteFallback() {
  return (
    <RouteShell>
      <Card className="w-full max-w-md">
        <CardHeader>
          <AlertTriangle className="mb-2 h-5 w-5 text-muted-foreground" />
          <CardTitle>Route not found</CardTitle>
          <CardDescription>The requested MVP route does not exist.</CardDescription>
        </CardHeader>
        <CardContent>
          <Button onClick={() => window.location.assign("/")} size="sm">
            <RouteIcon className="h-4 w-4" />
            Go home
          </Button>
        </CardContent>
      </Card>
    </RouteShell>
  );
}

function RouteLoading() {
  return (
    <RouteShell>
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle>Loading route</CardTitle>
          <CardDescription>Checking seeded roles and demo session.</CardDescription>
        </CardHeader>
      </Card>
    </RouteShell>
  );
}

function RouteShell({ children }: { children: ReactNode }) {
  return (
    <main className="flex min-h-dvh items-center justify-center bg-background px-4 text-foreground">
      {children}
    </main>
  );
}
