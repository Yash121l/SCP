import { userHasPermission, type SessionUser } from "@scp/contracts";
import { hubScope, institutionScope, isGlobalScope, studentScope } from "../access/scope.js";
import type { createSearchRepository } from "./search.repository.js";

export type SearchService = ReturnType<typeof createSearchService>;

export function createSearchService(repository: ReturnType<typeof createSearchRepository>) {
  return {
    search(user: SessionUser, query: string) {
      const hasExpertReviewScope = user.roles.includes("external_expert");
      const canSeeProgrammeRecords = isGlobalScope(user) || hasExpertReviewScope;

      return repository.search(query, {
        canSearchApprovals: userHasPermission(user, "governance:read"),
        canSearchCurriculum: userHasPermission(user, "curriculum:read"),
        canSearchEmployees: userHasPermission(user, "people:read"),
        canSearchHubs: userHasPermission(user, "hubs:read"),
        canSearchInstitutions: userHasPermission(user, "institutions:read"),
        canSearchProjects: userHasPermission(user, "projects:read"),
        canSearchStudents: userHasPermission(user, "students:read"),
        canSeeAll: canSeeProgrammeRecords,
        hubId: hubScope(user),
        institutionId: institutionScope(user),
        studentId: studentScope(user),
      });
    },
  };
}
