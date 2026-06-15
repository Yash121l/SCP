import { NavLink } from "react-router-dom";
import type { LoginResponse } from "@scp/contracts";
import { roleLabels } from "@scp/contracts";
import { BrandMark } from "../brand/brand-mark.js";
import { getVisibleWorkspaceNav } from "./nav-items.js";

const navGroups = ["OVERVIEW", "OPERATIONS", "CONTROL"] as const;

export function AppSidebar({ session }: { session: LoginResponse }) {
  const primaryRole = session.user.roles[0];
  const roleLabel = primaryRole ? roleLabels[primaryRole] : "Scoped user";
  const navItems = getVisibleWorkspaceNav(session.user);

  return (
    <aside className="sidebar">
      <div className="sidebar-brand">
        <BrandMark size="sm" />
        <div>
          <strong>SAKSHAM Portal</strong>
          <span>{session.user.scope.organizationName}</span>
        </div>
      </div>

      <nav className="sidebar-nav" aria-label="Primary">
        {navGroups.map((group) => (
          <div className="sidebar-nav-group" key={group}>
            <p>{group}</p>
            {navItems
              .filter((item) => item.group === group)
              .map((item) => {
                const Icon = item.icon;
                return (
                  <NavLink
                    key={item.key}
                    to={item.path}
                    className={({ isActive }) => (isActive ? "active" : undefined)}
                  >
                    <Icon size={16} />
                    <span>{item.label}</span>
                  </NavLink>
                );
              })}
          </div>
        ))}
      </nav>

      <div className="scope-card">
        <span className="eyebrow">Current role</span>
        <strong>{roleLabel}</strong>
        <span>{session.user.scope.organizationType} scope</span>
      </div>
    </aside>
  );
}
