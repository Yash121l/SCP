import { z } from "zod";
import type { SessionUser } from "./auth.js";

export const programmeRoles = [
  "government_main",
  "steering_committee",
  "incubator",
  "incubator_employee",
  "school",
  "student",
  "external_expert",
] as const;

export type ProgrammeRole = (typeof programmeRoles)[number];

export const permissions = [
  "dashboard:read",
  "profile:read",
  "hubs:read",
  "hubs:manage",
  "institutions:read",
  "institutions:manage",
  "people:read",
  "people:manage",
  "students:read",
  "students:manage",
  "projects:read",
  "projects:manage",
  "project_feedback:manage",
  "curriculum:read",
  "curriculum:manage",
  "experts:read",
  "experts:manage",
  "governance:read",
  "governance:manage",
  "approvals:review",
  "notifications:read",
  "search:read",
  "audit:read",
] as const;

export type Permission = (typeof permissions)[number];

export const roleLabels: Record<ProgrammeRole, string> = {
  government_main: "Government Main",
  steering_committee: "Steering Committee",
  incubator: "Incubator",
  incubator_employee: "Incubator Employee",
  school: "School",
  student: "Student",
  external_expert: "External Expert",
};

export const rolePermissions: Record<ProgrammeRole, Permission[]> = {
  government_main: [...permissions],
  steering_committee: [
    "dashboard:read",
    "profile:read",
    "hubs:read",
    "hubs:manage",
    "institutions:read",
    "people:read",
    "people:manage",
    "students:read",
    "projects:read",
    "governance:read",
    "approvals:review",
    "notifications:read",
    "search:read",
    "audit:read",
  ],
  incubator: [
    "dashboard:read",
    "profile:read",
    "hubs:read",
    "institutions:read",
    "institutions:manage",
    "people:read",
    "students:read",
    "projects:read",
    "projects:manage",
    "curriculum:read",
    "curriculum:manage",
    "governance:read",
    "governance:manage",
    "approvals:review",
    "notifications:read",
    "search:read",
  ],
  incubator_employee: [
    "dashboard:read",
    "profile:read",
    "hubs:read",
    "institutions:read",
    "people:read",
    "students:read",
    "students:manage",
    "projects:read",
    "projects:manage",
    "curriculum:read",
    "curriculum:manage",
    "notifications:read",
    "search:read",
  ],
  school: [
    "dashboard:read",
    "profile:read",
    "hubs:read",
    "institutions:read",
    "people:read",
    "students:read",
    "students:manage",
    "projects:read",
    "projects:manage",
    "curriculum:read",
    "notifications:read",
    "search:read",
  ],
  student: [
    "dashboard:read",
    "profile:read",
    "institutions:read",
    "students:read",
    "projects:read",
    "projects:manage",
    "curriculum:read",
    "notifications:read",
    "search:read",
  ],
  external_expert: [
    "dashboard:read",
    "profile:read",
    "institutions:read",
    "projects:read",
    "project_feedback:manage",
    "curriculum:read",
    "experts:read",
    "notifications:read",
    "search:read",
  ],
};

export const roleSchema = z.enum(programmeRoles);
export const permissionSchema = z.enum(permissions);

export function roleHasPermission(role: ProgrammeRole, permission: Permission): boolean {
  return rolePermissions[role].includes(permission);
}

export function userHasPermission(user: Pick<SessionUser, "roles">, permission: Permission): boolean {
  return user.roles.some((role) => roleHasPermission(role, permission));
}
