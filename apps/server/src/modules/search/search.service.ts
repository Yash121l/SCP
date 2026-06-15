import type { SessionUser } from "@scp/contracts";
import { hubScope, institutionScope, isGlobalScope, studentScope } from "../access/scope.js";
import type { createSearchRepository } from "./search.repository.js";

export type SearchService = ReturnType<typeof createSearchService>;

export function createSearchService(repository: ReturnType<typeof createSearchRepository>) {
  return {
    search(user: SessionUser, query: string) {
      return repository.search(query, {
        canSeeAll: isGlobalScope(user),
        hubId: hubScope(user),
        institutionId: institutionScope(user),
        studentId: studentScope(user),
      });
    },
  };
}
