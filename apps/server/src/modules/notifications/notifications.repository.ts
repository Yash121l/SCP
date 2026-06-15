import { notifications, type DatabaseClient } from "@scp/database";
import type { NotificationItem, ProgrammeRole } from "@scp/contracts";
import { desc, eq, inArray, or } from "drizzle-orm";

function toNotification(row: typeof notifications.$inferSelect): NotificationItem {
  return {
    body: row.body,
    createdAt: row.createdAt.toISOString(),
    id: row.id,
    readAt: row.readAt?.toISOString() ?? null,
    title: row.title,
  };
}

export function createNotificationRepository(db: DatabaseClient) {
  return {
    async list(input: { roles: ProgrammeRole[]; userId: string }): Promise<NotificationItem[]> {
      const rows = await db
        .select()
        .from(notifications)
        .where(or(eq(notifications.userId, input.userId), inArray(notifications.role, input.roles)))
        .orderBy(desc(notifications.createdAt))
        .limit(20);

      return rows.map(toNotification);
    },
  };
}
