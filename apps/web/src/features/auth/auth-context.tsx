import { createContext, useContext, useMemo, useState, type ReactNode } from "react";
import type { LoginResponse } from "@scp/contracts";
import { login as loginRequest, logout as logoutRequest } from "../../lib/api.js";
import { clearSession, loadSession, saveSession } from "../../lib/session.js";

type AuthContextValue = {
  session: LoginResponse | null;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => void;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<LoginResponse | null>(() => loadSession());

  const value = useMemo<AuthContextValue>(
    () => ({
      session,
      async signIn(email, password) {
        const nextSession = await loginRequest(email, password);
        saveSession(nextSession);
        setSession(nextSession);
      },
      signOut() {
        void logoutRequest().catch(() => undefined);
        clearSession();
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

