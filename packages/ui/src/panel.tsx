import type { HTMLAttributes, ReactNode } from "react";
import { cn } from "./cn.js";

export function Panel({
  children,
  className,
  title,
  action,
  ...props
}: HTMLAttributes<HTMLElement> & {
  title?: string;
  action?: ReactNode;
}) {
  return (
    <section className={cn("ui-panel", className)} {...props}>
      {(title || action) && (
        <div className="ui-panel-header">
          {title && <h2>{title}</h2>}
          {action}
        </div>
      )}
      {children}
    </section>
  );
}

