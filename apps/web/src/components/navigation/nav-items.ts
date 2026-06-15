import {
  Building2,
  BellDot,
  BookOpenCheck,
  ClipboardCheck,
  FileClock,
  FolderKanban,
  GraduationCap,
  LayoutDashboard,
  Network,
  UserCircle2,
  Users,
  UserRoundCheck,
  type LucideIcon,
} from "lucide-react";
import type { Permission, ProgrammeRole, SessionUser } from "@scp/contracts";
import { userHasPermission } from "@scp/contracts";

export type WorkspaceRouteKey =
  | "dashboard"
  | "updates"
  | "hubs"
  | "institutions"
  | "people"
  | "curriculum"
  | "experts"
  | "projects"
  | "students"
  | "governance"
  | "audit"
  | "profile";

export type WorkspaceNavItem = {
  group: "OVERVIEW" | "OPERATIONS" | "CONTROL";
  key: WorkspaceRouteKey;
  label: string;
  icon: LucideIcon;
  path: string;
  permission: Permission;
  roles: ProgrammeRole[];
};

export const workspaceNavItems: WorkspaceNavItem[] = [
  {
    group: "OVERVIEW",
    key: "dashboard",
    label: "Dashboard",
    icon: LayoutDashboard,
    path: "/workspace/dashboard",
    permission: "dashboard:read",
    roles: ["government_main", "steering_committee", "incubator", "incubator_employee", "school", "student", "external_expert"],
  },
  {
    group: "OVERVIEW",
    key: "updates",
    label: "Updates",
    icon: BellDot,
    path: "/workspace/updates",
    permission: "notifications:read",
    roles: ["government_main", "steering_committee", "incubator", "incubator_employee", "school", "student", "external_expert"],
  },
  {
    group: "OPERATIONS",
    key: "hubs",
    label: "Incubators",
    icon: Network,
    path: "/workspace/hubs",
    permission: "hubs:read",
    roles: ["government_main", "steering_committee"],
  },
  {
    group: "OPERATIONS",
    key: "institutions",
    label: "Schools",
    icon: Building2,
    path: "/workspace/institutions",
    permission: "institutions:read",
    roles: ["government_main", "steering_committee", "incubator", "incubator_employee"],
  },
  {
    group: "OPERATIONS",
    key: "people",
    label: "Employees",
    icon: Users,
    path: "/workspace/people",
    permission: "people:read",
    roles: ["government_main", "steering_committee", "incubator"],
  },
  {
    group: "OPERATIONS",
    key: "curriculum",
    label: "Curriculum",
    icon: BookOpenCheck,
    path: "/workspace/curriculum",
    permission: "curriculum:read",
    roles: ["government_main", "steering_committee", "incubator", "incubator_employee", "school", "student", "external_expert"],
  },
  {
    group: "OPERATIONS",
    key: "students",
    label: "Students",
    icon: GraduationCap,
    path: "/workspace/students",
    permission: "students:read",
    roles: ["government_main", "steering_committee", "incubator", "incubator_employee", "school"],
  },
  {
    group: "OPERATIONS",
    key: "projects",
    label: "Projects",
    icon: FolderKanban,
    path: "/workspace/projects",
    permission: "projects:read",
    roles: ["government_main", "steering_committee", "incubator", "incubator_employee", "school", "student", "external_expert"],
  },
  {
    group: "OPERATIONS",
    key: "experts",
    label: "Experts",
    icon: UserRoundCheck,
    path: "/workspace/experts",
    permission: "experts:read",
    roles: ["government_main", "steering_committee", "external_expert"],
  },
  {
    group: "CONTROL",
    key: "governance",
    label: "Governance",
    icon: ClipboardCheck,
    path: "/workspace/governance",
    permission: "governance:read",
    roles: ["government_main", "steering_committee", "incubator"],
  },
  {
    group: "CONTROL",
    key: "audit",
    label: "Audit",
    icon: FileClock,
    path: "/workspace/audit",
    permission: "audit:read",
    roles: ["government_main", "steering_committee"],
  },
  {
    group: "CONTROL",
    key: "profile",
    label: "Profile",
    icon: UserCircle2,
    path: "/workspace/profile",
    permission: "profile:read",
    roles: ["government_main", "steering_committee", "incubator", "incubator_employee", "school", "student", "external_expert"],
  },
];

export function getVisibleWorkspaceNav(user: SessionUser) {
  return workspaceNavItems.filter((item) => {
    const roleMatch = user.roles.some((role) => item.roles.includes(role));
    return roleMatch && userHasPermission(user, item.permission);
  });
}
