export type StatusVariant = "secondary" | "success" | "warning" | "danger";

export function statusVariant(status: string): StatusVariant {
  const value = status.toLowerCase();
  if (["critical", "high", "escalated", "blocked"].some((item) => value.includes(item))) {
    return "danger";
  }
  if (["medium", "review", "due", "support", "watch", "active"].some((item) => value.includes(item))) {
    return "warning";
  }
  if (["ready", "submitted", "low", "track", "healthy", "done"].some((item) => value.includes(item))) {
    return "success";
  }
  return "secondary";
}
