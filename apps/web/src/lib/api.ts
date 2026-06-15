import type { DashboardSummary, LoginResponse } from "@scp/contracts";

const apiBaseUrl = import.meta.env.VITE_API_BASE_URL ?? "";

async function parseResponse<T>(response: Response): Promise<T> {
  const body = (await response.json().catch(() => null)) as T | { message?: string } | null;

  if (!response.ok) {
    const message =
      body && typeof body === "object" && "message" in body
        ? body.message
        : `Request failed with ${response.status}`;
    throw new Error(message);
  }

  return body as T;
}

export async function login(email: string, password: string): Promise<LoginResponse> {
  const response = await fetch(`${apiBaseUrl}/api/auth/login`, {
    body: JSON.stringify({ email, password }),
    credentials: "include",
    headers: {
      "content-type": "application/json",
    },
    method: "POST",
  });

  return parseResponse<LoginResponse>(response);
}

export async function logout(): Promise<void> {
  const response = await fetch(`${apiBaseUrl}/api/auth/logout`, {
    credentials: "include",
    method: "POST",
  });

  await parseResponse<{ ok: boolean }>(response);
}

export async function apiGet<T = DashboardSummary>(path: string, token?: string): Promise<T> {
  const response = await fetch(`${apiBaseUrl}${path}`, {
    credentials: "include",
    headers: {
      ...(token ? { authorization: `Bearer ${token}` } : {}),
    },
  });

  return parseResponse<T>(response);
}

export async function apiPost<T>(path: string, payload: unknown, token?: string): Promise<T> {
  const response = await fetch(`${apiBaseUrl}${path}`, {
    body: JSON.stringify(payload),
    credentials: "include",
    headers: {
      "content-type": "application/json",
      ...(token ? { authorization: `Bearer ${token}` } : {}),
    },
    method: "POST",
  });

  return parseResponse<T>(response);
}

export async function apiPatch<T>(path: string, payload: unknown, token?: string): Promise<T> {
  const response = await fetch(`${apiBaseUrl}${path}`, {
    body: JSON.stringify(payload),
    credentials: "include",
    headers: {
      "content-type": "application/json",
      ...(token ? { authorization: `Bearer ${token}` } : {}),
    },
    method: "PATCH",
  });

  return parseResponse<T>(response);
}

export async function apiDelete<T>(path: string, token?: string): Promise<T> {
  const response = await fetch(`${apiBaseUrl}${path}`, {
    credentials: "include",
    headers: {
      ...(token ? { authorization: `Bearer ${token}` } : {}),
    },
    method: "DELETE",
  });

  return parseResponse<T>(response);
}
