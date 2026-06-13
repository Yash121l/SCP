import { useEffect, useState } from "react";
import { BrowserRouter } from "react-router-dom";
import { AppRouter } from "./features/routing/app-router";
import { useTheme } from "./hooks/use-theme";
import { api } from "./lib/api";
import type { Role } from "./types";

const SESSION_ROLE_KEY = "scp-demo-role";

export function App() {
  const [roles, setRoles] = useState<Role[]>([]);
  const [role, setRole] = useState<Role | null>(null);
  const [search, setSearch] = useState("");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [bootError, setBootError] = useState<string | null>(null);
  const [rolesLoaded, setRolesLoaded] = useState(false);
  const { theme, toggleTheme } = useTheme();

  useEffect(() => {
    api
      .roles()
      .then((result) => {
        setRoles(result.roles);
        const storedRoleId = window.localStorage.getItem(SESSION_ROLE_KEY);
        const storedRole = result.roles.find((item) => item.id === storedRoleId);
        if (storedRole) setRole((current) => current ?? storedRole);
      })
      .catch((error: unknown) => {
        setBootError(error instanceof Error ? error.message : "API unavailable");
      })
      .finally(() => {
        setRolesLoaded(true);
      });
  }, []);

  async function login(roleId: string): Promise<Role> {
    const result = await api.login(roleId);
    window.localStorage.setItem(SESSION_ROLE_KEY, result.role.id);
    setRole(result.role);
    setSearch("");
    setSidebarOpen(false);
    return result.role;
  }

  function logout() {
    window.localStorage.removeItem(SESSION_ROLE_KEY);
    setRole(null);
    setSearch("");
    setSidebarOpen(false);
  }

  return (
    <BrowserRouter>
      <AppRouter
        bootError={bootError}
        login={login}
        logout={logout}
        onBeforeNavigate={() => {
          setSearch("");
          setSidebarOpen(false);
        }}
        onMenu={() => setSidebarOpen(true)}
        onSearch={setSearch}
        onSidebarClose={() => setSidebarOpen(false)}
        role={role}
        roles={roles}
        rolesLoaded={rolesLoaded}
        search={search}
        sidebarOpen={sidebarOpen}
        theme={theme}
        toggleTheme={toggleTheme}
      />
    </BrowserRouter>
  );
}
