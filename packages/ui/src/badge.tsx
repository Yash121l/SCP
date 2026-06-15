import type { HTMLAttributes } from "react";
import { cn } from "./cn.js";

type BadgeTone = "neutral" | "blue" | "green" | "amber" | "red";

export function Badge({
  className,
  tone = "neutral",
  ...props
}: HTMLAttributes<HTMLSpanElement> & { tone?: BadgeTone }) {
  return <span className={cn("ui-badge", `ui-badge-${tone}`, className)} {...props} />;
}

