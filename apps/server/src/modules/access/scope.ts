import type { SessionUser } from "@scp/contracts";

export function isGlobalScope(user: SessionUser) {
  return user.roles.some((role) => role === "government_main" || role === "steering_committee");
}

export function hubScope(user: SessionUser) {
  return isGlobalScope(user) ? null : (user.scope.hubId ?? null);
}

export function institutionScope(user: SessionUser) {
  return user.roles.some((role) => role === "school" || role === "student")
    ? (user.scope.institutionId ?? null)
    : null;
}

export function studentScope(user: SessionUser) {
  return user.roles.includes("student") ? (user.scope.studentId ?? null) : null;
}
