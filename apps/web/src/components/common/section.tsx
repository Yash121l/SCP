import type { ReactNode } from "react";

export function Section({
  children,
  description,
  eyebrow = "Central Programme Portal",
  title,
}: {
  children: ReactNode;
  description: string;
  eyebrow?: string;
  title: string;
}) {
  return (
    <div className="grid max-w-7xl gap-4">
      <div className="flex flex-col justify-between gap-2 md:flex-row md:items-end">
        <div>
          <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.18em] text-primary">
            {eyebrow}
          </p>
          <h1 className="mt-1 text-2xl font-semibold tracking-normal md:text-3xl">{title}</h1>
        </div>
        <p className="max-w-xl text-xs leading-5 text-muted-foreground">{description}</p>
      </div>
      {children}
    </div>
  );
}
