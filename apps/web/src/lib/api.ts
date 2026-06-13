import type {
  Approval,
  AuditEvent,
  Dashboard,
  Institution,
  Project,
  Report,
  ResourceDoc,
  Role,
} from "../types";

const API_URL = import.meta.env.VITE_API_URL || "http://127.0.0.1:4000";

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${API_URL}${path}`, {
    headers: {
      "Content-Type": "application/json",
      ...init?.headers,
    },
    ...init,
  });

  if (!response.ok) {
    const body = (await response.json().catch(() => null)) as { message?: string } | null;
    throw new Error(body?.message || `Request failed with ${response.status}`);
  }

  return response.json() as Promise<T>;
}

function roleQuery(roleId: string, search = "") {
  const params = new URLSearchParams({ roleId });
  if (search) params.set("search", search);
  return params.toString();
}

export const api = {
  roles: () => request<{ roles: Role[] }>("/api/roles"),
  login: (roleId: string) =>
    request<{ role: Role }>("/api/auth/demo-login", {
      method: "POST",
      body: JSON.stringify({ roleId }),
    }),
  dashboard: (roleId: string) =>
    request<Dashboard>(`/api/dashboard?${roleQuery(roleId)}`),
  institutions: (roleId: string, search: string) =>
    request<{ institutions: Institution[] }>(`/api/institutions?${roleQuery(roleId, search)}`),
  projects: (roleId: string, search: string) =>
    request<{ projects: Project[] }>(`/api/projects?${roleQuery(roleId, search)}`),
  governance: (roleId: string, search: string) =>
    request<{ approvals: Approval[] }>(`/api/governance?${roleQuery(roleId, search)}`),
  approve: (roleId: string, approvalId: string) =>
    request<{ ok: true }>(`/api/governance/${approvalId}/approve`, {
      method: "POST",
      body: JSON.stringify({ roleId }),
    }),
  resources: (roleId: string, search: string) =>
    request<{ resources: ResourceDoc[] }>(`/api/resources?${roleQuery(roleId, search)}`),
  reports: (roleId: string, search: string) =>
    request<{ reports: Report[] }>(`/api/reports?${roleQuery(roleId, search)}`),
  runReport: (roleId: string, reportId?: string) =>
    request<{ ok: true }>("/api/reports/run", {
      method: "POST",
      body: JSON.stringify({ roleId, reportId }),
    }),
  audit: (roleId: string) =>
    request<{ events: AuditEvent[] }>(`/api/audit?${roleQuery(roleId)}`),
};
