import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import type { DashboardSummary, LoginResponse } from "@scp/contracts";
import { apiGet } from "../../lib/api.js";

type WorkspaceDataContextValue = {
  error: string | null;
  isLoading: boolean;
  refresh: () => Promise<void>;
  summary: DashboardSummary | null;
};

const WorkspaceDataContext = createContext<WorkspaceDataContextValue | null>(null);

export function WorkspaceDataProvider({
  children,
  session,
}: {
  children: ReactNode;
  session: LoginResponse;
}) {
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  async function refresh() {
    setIsLoading(true);
    try {
      setSummary(await apiGet<DashboardSummary>("/api/dashboard", session.token));
      setError(null);
    } catch (unknownError) {
      setError(unknownError instanceof Error ? unknownError.message : "Could not load dashboard data");
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    void refresh();
  }, [session.token]);

  const value = useMemo(
    () => ({
      error,
      isLoading,
      refresh,
      summary,
    }),
    [error, isLoading, summary],
  );

  return <WorkspaceDataContext.Provider value={value}>{children}</WorkspaceDataContext.Provider>;
}

export function useWorkspaceDataState() {
  const context = useContext(WorkspaceDataContext);

  if (!context) {
    throw new Error("useWorkspaceDataState must be used inside WorkspaceDataProvider");
  }

  return context;
}

export function useWorkspaceSummary() {
  const { summary } = useWorkspaceDataState();

  if (!summary) {
    throw new Error("Workspace summary is not loaded");
  }

  return summary;
}

