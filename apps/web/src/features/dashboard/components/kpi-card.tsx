import type { Kpi } from "@scp/contracts";

export function KpiCard({ kpi }: { kpi: Kpi }) {
  return (
    <article className={`kpi-card tone-${kpi.tone}`}>
      <span>{kpi.label}</span>
      <strong>{kpi.value}</strong>
      <small>{kpi.change}</small>
    </article>
  );
}

