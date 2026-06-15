import type { Kpi } from "@scp/contracts";
import { KpiCard } from "./kpi-card.js";

export function KpiGrid({ kpis }: { kpis: Kpi[] }) {
  return (
    <section className="kpi-grid" aria-label="Key metrics">
      {kpis.map((kpi) => (
        <KpiCard key={kpi.label} kpi={kpi} />
      ))}
    </section>
  );
}

