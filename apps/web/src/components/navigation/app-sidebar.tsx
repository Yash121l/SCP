import { NavLink } from "react-router-dom";
import type { LoginResponse } from "@scp/contracts";
import { roleLabels } from "@scp/contracts";
import { BrandMark } from "../brand/brand-mark.js";
import { getVisibleWorkspaceNav } from "./nav-items.js";
import { useMobileSidebar } from "./mobile-sidebar-context.js";
import { Menu, X } from "lucide-react";

const navGroups = ["OVERVIEW", "OPERATIONS", "CONTROL"] as const;

export function AppSidebar({ session }: { session: LoginResponse }) {
  const primaryRole = session.user.roles[0];
  const roleLabel = primaryRole ? roleLabels[primaryRole] : "Scoped user";
  const navItems = getVisibleWorkspaceNav(session.user);
  const { isOpen, setIsOpen } = useMobileSidebar();

  return (
    <>
      {isOpen && (
        <div 
          className="mobile-sidebar-backdrop" 
          onClick={() => setIsOpen(false)}
          style={{
            position: "fixed",
            inset: 0,
            backgroundColor: "rgba(0, 0, 0, 0.6)",
            backdropFilter: "blur(4px)",
            zIndex: 40
          }}
        />
      )}
      <aside 
        className={`sidebar ${isOpen ? "is-open" : ""}`}
        style={{
          transform: isOpen ? "translateX(0)" : "",
        }}
      >
      <div className="sidebar-brand">
        <BrandMark size="sm" />
        <div style={{ flex: 1, minWidth: 0 }}>
          <strong style={{ whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>SAKSHAM Portal</strong>
          <span style={{ whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{session.user.scope.organizationName}</span>
        </div>
        {isOpen && (
          <button 
            onClick={() => setIsOpen(false)}
            className="mobile-sidebar-close"
            style={{ 
              background: "transparent", 
              border: 0, 
              color: "var(--text-muted)",
              padding: "4px"
            }}
          >
            <X size={20} />
          </button>
        )}
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
                    onClick={() => setIsOpen(false)}
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
    </>
  );
}
