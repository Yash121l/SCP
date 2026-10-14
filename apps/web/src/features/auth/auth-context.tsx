import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import type { LoginResponse } from "@scp/contracts";
import { login as loginRequest, logout as logoutRequest } from "../../lib/api.js";
import { identifyUser, resetAnalytics, track } from "../../lib/analytics.js";
import { clearSession, loadSession, saveSession } from "../../lib/session.js";

type AuthContextValue = {
  session: LoginResponse | null;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => void;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<LoginResponse | null>(() => loadSession());

  // Re-identify returning users whose session was restored from storage.
  useEffect(() => {
    if (session) identifyUser(session.user);
  }, [session]);

  const value = useMemo<AuthContextValue>(
    () => ({
      session,
      async signIn(email, password) {
        const nextSession = await loginRequest(email, password);
        saveSession(nextSession);
        identifyUser(nextSession.user);
        track("user_logged_in", {
          roles: nextSession.user.roles,
          organization_type: nextSession.user.scope.organizationType,
        });
        setSession(nextSession);
      },
      signOut() {
        void logoutRequest().catch(() => undefined);
        clearSession();
        resetAnalytics();
        setSession(null);
      },
    }),
    [session],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error("useAuth must be used inside AuthProvider");
  }

  return context;
}

