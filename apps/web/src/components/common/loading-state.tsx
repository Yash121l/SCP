import { Loader2 } from "lucide-react";

export function LoadingState({ error, label }: { error: string | null; label: string }) {
  if (error) {
    return (
      <div className="rounded-lg border border-rose-500/30 bg-rose-500/10 p-3 text-sm text-rose-700 dark:text-rose-200">
        {error}
      </div>
    );
  }

  return (
    <div className="flex min-h-24 items-center justify-center gap-2 rounded-lg border bg-card text-sm text-muted-foreground">
      <Loader2 className="h-4 w-4 animate-spin" />
      {label}
    </div>
  );
}
