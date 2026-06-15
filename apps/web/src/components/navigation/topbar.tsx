import { useEffect, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { Bell, LogOut, Search, UserCircle2 } from "lucide-react";
import type { SearchResult, SessionUser } from "@scp/contracts";
import { Badge, Button } from "@scp/ui";
import { useAuth } from "../../features/auth/auth-context.js";
import { useWorkspaceDataState } from "../../features/workspace/workspace-data.js";
import { apiGet } from "../../lib/api.js";
import { ThemeToggle } from "../theme/theme-toggle.js";
import { useCommandPalette } from "./command-palette-context.js";
import { useMobileSidebar } from "./mobile-sidebar-context.js";
import { Menu } from "lucide-react";

const searchTypeLabel: Record<SearchResult["type"], string> = {
  approval: "approval",
  curriculum: "curriculum",
  employee: "employee",
  hub: "incubator",
  institution: "school",
  project: "project",
  student: "student",
};

const titles: Record<string, string> = {
  "/workspace/dashboard": "Dashboard",
  "/workspace/updates": "Updates",
  "/workspace/hubs": "Incubators",
  "/workspace/hubs/new": "New Incubator",
  "/workspace/institutions": "Schools",
  "/workspace/institutions/new": "New School",
  "/workspace/people": "Employees",
  "/workspace/people/new": "New Employee",
  "/workspace/curriculum": "Curriculum",
  "/workspace/projects": "Projects",
  "/workspace/projects/new": "New Project",
  "/workspace/students": "Students",
  "/workspace/students/new": "New Student",
  "/workspace/governance": "Governance",
  "/workspace/experts": "Experts",
  "/workspace/audit": "Audit",
  "/workspace/profile": "Profile",
};

function titleForPath(pathname: string) {
  if (titles[pathname]) {
    return titles[pathname];
  }

  if (pathname.startsWith("/workspace/hubs/")) {
    return "Incubator Detail";
  }

  if (pathname.startsWith("/workspace/institutions/")) {
    return "School Detail";
  }

  if (pathname.startsWith("/workspace/students/")) {
    return "Student Detail";
  }

  if (pathname.startsWith("/workspace/projects/")) {
    return "Project Detail";
  }

  if (pathname.startsWith("/workspace/curriculum/")) {
    return "Curriculum Detail";
  }

  return "SAKSHAM";
}

export function Topbar({ user, onLogout }: { user: SessionUser; onLogout: () => void }) {
  const { session } = useAuth();
  const { summary } = useWorkspaceDataState();
  const location = useLocation();
  const navigate = useNavigate();
  const { setIsOpen: setCommandPaletteOpen } = useCommandPalette();
  const { toggle: toggleMobileSidebar } = useMobileSidebar();
  const [panel, setPanel] = useState<"notifications" | null>(null);

  return (
    <header className="topbar">
      <button 
        className="mobile-sidebar-toggle" 
        onClick={toggleMobileSidebar}
      >
        <Menu size={20} />
      </button>
      <h1>{titleForPath(location.pathname)}</h1>
      <div 
        className="search-box" 
        onClick={() => setCommandPaletteOpen(true)}
        style={{ cursor: "text" }}
      >
        <Search size={16} color="var(--text-muted)" />
        <span style={{ color: "var(--text-muted)", fontSize: "13px", flex: 1 }}>Search incubators, schools, projects...</span>
        <Badge tone="neutral" style={{ fontSize: "10px", padding: "2px 6px" }}>⌘K</Badge>
      </div>
      <div className="topbar-actions">
        <ThemeToggle />
        <Button
          aria-label="Notifications"
          onClick={() => setPanel(panel === "notifications" ? null : "notifications")}
          size="icon"
          title="Notifications"
        >
          <Bell size={16} />
        </Button>
        <Link className="user-chip" to="/workspace/profile">
          <UserCircle2 size={15} />
          <span>{user.name}</span>
          <Badge tone="green">Active</Badge>
        </Link>
        <Button onClick={onLogout}>
          <LogOut size={16} />
          Sign out
        </Button>
      </div>

      {panel === "notifications" && (
        <div className="topbar-popover action-panel">
          <div className="panel-title">
            <Bell size={16} />
            <strong>Notifications</strong>
          </div>
          <div className="notification-list">
            {(summary?.notifications.length ?? 0) === 0 ? (
              <p>No notifications for this role.</p>
            ) : (
              summary?.notifications.map((item) => (
                <div className="notification-item" key={item.id}>
                  <strong>{item.title}</strong>
                  <span>{item.body}</span>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </header>
  );
}
