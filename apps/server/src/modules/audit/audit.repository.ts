import { auditLogs, type DatabaseClient } from "@scp/database";
import type { AuditEntry, SessionUser } from "@scp/contracts";
import { desc } from "drizzle-orm";

export type AuditInput = {
  actor: SessionUser;
  action: string;
  entityId: string;
  entityType: string;
  metadata?: Record<string, unknown>;
};

export function createAuditRepository(db: DatabaseClient) {
  return {
    async list(limit = 50): Promise<AuditEntry[]> {
      const rows = await db
        .select({
          action: auditLogs.action,
          actor: auditLogs.actorName,
          createdAt: auditLogs.createdAt,
          entityType: auditLogs.entityType,
          id: auditLogs.id,
        })
        .from(auditLogs)
        .orderBy(desc(auditLogs.createdAt))
        .limit(limit);

      return rows.map((row) => ({
        ...row,
        createdAt: row.createdAt.toISOString(),
      }));
    },

    async write(input: AuditInput): Promise<void> {
      await db.insert(auditLogs).values({
        action: input.action,
        actorName: input.actor.name,
        actorUserId: input.actor.id,
        entityId: input.entityId,
        entityType: input.entityType,
        metadata: input.metadata ?? {},
      });
    },
  };
}

