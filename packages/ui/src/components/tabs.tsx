import * as React from "react";
import { cn } from "../lib/cn.js";

type TabsProps<T extends string> = {
  value: T;
  tabs: Array<{ value: T; label: string }>;
  onChange: (value: T) => void;
  className?: string;
};

export function SegmentedTabs<T extends string>({
  value,
  tabs,
  onChange,
  className,
}: TabsProps<T>) {
  return (
    <div
      className={cn("inline-flex rounded-lg border bg-muted p-1", className)}
      role="tablist"
    >
      {tabs.map((tab) => (
        <button
          aria-selected={value === tab.value}
          className={cn(
            "h-7 rounded-md px-3 text-xs font-medium text-muted-foreground transition-colors",
            value === tab.value && "bg-background text-foreground shadow-sm",
          )}
          key={tab.value}
          onClick={() => onChange(tab.value)}
          role="tab"
          type="button"
        >
          {tab.label}
        </button>
      ))}
    </div>
  );
}
