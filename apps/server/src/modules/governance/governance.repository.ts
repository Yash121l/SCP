import { approvals, type DatabaseClient } from "@scp/database";
import type { ApprovalItem } from "@scp/contracts";
import { and, asc, eq } from "drizzle-orm";
import type { ApprovalCreateInput, ApprovalDecisionInput } from "./governance.schemas.js";

function toApprovalItem(row: typeof approvals.$inferSelect): ApprovalItem {
  return {
    dueAt: row.dueAt,
    id: row.id,
    module: row.module,
    owner: row.owner,
    status: row.status === "rejected" ? "returned" : row.status,
    title: row.title,
  };
}

export function createGovernanceRepository(db: DatabaseClient) {
  return {
    async create(input: ApprovalCreateInput & { createdByUserId: string; organizationId: string | null }) {
      const [approval] = await db
        .insert(approvals)
        .values(input)
        .returning();

      if (!approval) {
        throw new Error("Approval was not created");
      }

      return toApprovalItem(approval);
    },

    async decide(input: ApprovalDecisionInput & { decidedByUserId: string; id: string }) {
      const [approval] = await db
        .update(approvals)
        .set({
          decidedAt: new Date(),
          decidedByUserId: input.decidedByUserId,
          decisionNote: input.decisionNote,
          status: input.status,
          updatedAt: new Date(),
        })
        .where(and(eq(approvals.id, input.id), eq(approvals.status, "pending")))
        .returning();

      if (!approval) {
        return null;
      }

      return toApprovalItem(approval);
    },

    async list() {
      const rows = await db.select().from(approvals).orderBy(asc(approvals.dueAt)).limit(100);
      return rows.map(toApprovalItem);
    },
  };
}

