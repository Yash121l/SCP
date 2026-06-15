import { indicators, type DatabaseClient } from "@scp/database";
import type { ProgrammeIndicator } from "@scp/contracts";
import { asc } from "drizzle-orm";

export function createIndicatorRepository(db: DatabaseClient) {
  return {
    async list(): Promise<ProgrammeIndicator[]> {
      const rows = await db
        .select({
          label: indicators.label,
          target: indicators.target,
          unit: indicators.unit,
          value: indicators.value,
        })
        .from(indicators)
        .orderBy(asc(indicators.createdAt))
        .limit(8);

      return rows.map((row) => ({
        label: row.label,
        target: Number(row.target),
        unit: row.unit,
        value: Number(row.value),
      }));
    },
  };
}

