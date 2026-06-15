import type { SessionUser } from "@scp/contracts";
import type { createNotificationRepository } from "./notifications.repository.js";

export type NotificationService = ReturnType<typeof createNotificationService>;

export function createNotificationService(repository: ReturnType<typeof createNotificationRepository>) {
  return {
    list(user: SessionUser) {
      return repository.list({
        roles: user.roles,
        userId: user.id,
      });
    },
  };
}
