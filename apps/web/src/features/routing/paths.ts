import { workspaceFor } from "../../config/workspaces";
import type { Role } from "../../types";

export function workspacePath(role: Role, tabId?: string) {
  const workspace = workspaceFor(role);
  const resolvedTabId = tabId ?? workspace.nav[0]?.id ?? "overview";
  return `/workspaces/${role.id}/${resolvedTabId}`;
}
