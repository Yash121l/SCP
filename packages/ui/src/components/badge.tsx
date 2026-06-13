import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "../lib/cn.js";

const badgeVariants = cva(
  "inline-flex h-[18px] shrink-0 items-center justify-center gap-1 whitespace-nowrap rounded-sm border px-1.5 text-[11px] font-medium",
  {
    variants: {
      variant: {
        default: "border-transparent bg-primary text-primary-foreground",
        secondary: "border-transparent bg-secondary text-secondary-foreground",
        success: "border-transparent bg-emerald-500/10 text-emerald-700 dark:text-emerald-200",
        warning: "border-transparent bg-amber-500/10 text-amber-700 dark:text-amber-200",
        danger: "border-transparent bg-rose-500/10 text-rose-700 dark:text-rose-200",
        outline: "border-input bg-background text-foreground dark:bg-input/30",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  },
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

export function Badge({ className, variant, ...props }: BadgeProps) {
  return <div className={cn(badgeVariants({ variant }), className)} {...props} />;
}
