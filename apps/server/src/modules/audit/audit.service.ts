import type { createAuditRepository, AuditInput } from "./audit.repository.js";

export type AuditService = ReturnType<typeof createAuditService>;

export function createAuditService(repository: ReturnType<typeof createAuditRepository>) {
  return {
    list: repository.list,
    write(input: AuditInput) {
      return repository.write(input);
    },
  };
}

