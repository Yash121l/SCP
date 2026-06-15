import type { ProgrammeIndicator } from "@scp/contracts";

export function IndicatorList({ indicators }: { indicators: ProgrammeIndicator[] }) {
  return (
    <div className="indicator-list">
      {indicators.map((indicator) => {
        const progress = Math.min(100, Math.round((indicator.value / indicator.target) * 100));
        return (
          <div className="indicator-row" key={indicator.label}>
            <div>
              <strong>{indicator.label}</strong>
              <span>
                {indicator.value}
                {indicator.unit === "percent" ? "%" : ""} of {indicator.target}
                {indicator.unit === "percent" ? "%" : ""}
              </span>
            </div>
            <div className="progress-track" aria-label={`${indicator.label} progress`}>
              <span style={{ width: `${progress}%` }} />
            </div>
          </div>
        );
      })}
    </div>
  );
}

