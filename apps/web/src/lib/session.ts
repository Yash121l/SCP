import type { LoginResponse } from "@scp/contracts";

const storageKey = "scp.portal.session";

export type StoredSession = LoginResponse;

export function loadSession(): StoredSession | null {
  const raw = window.localStorage.getItem(storageKey);
  if (!raw) {
    return null;
  }

  try {
    return JSON.parse(raw) as StoredSession;
  } catch {
    window.localStorage.removeItem(storageKey);
    return null;
  }
}

export function saveSession(session: StoredSession) {
  window.localStorage.setItem(storageKey, JSON.stringify(session));
}

export function clearSession() {
  window.localStorage.removeItem(storageKey);
}

