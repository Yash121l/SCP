import type { SessionUser } from "@scp/contracts";
import { hubScope, institutionScope, isGlobalScope, studentScope } from "../access/scope.js";
import type { createCurriculumRepository } from "./curriculum.repository.js";

export type CurriculumService = ReturnType<typeof createCurriculumService>;

export function createCurriculumService(repository: ReturnType<typeof createCurriculumRepository>) {
  return {
    list(user: SessionUser) {
      return repository.list({
        canSeeAll: isGlobalScope(user) || user.roles.includes("external_expert"),
        hubId: hubScope(user),
        institutionId: institutionScope(user),
        studentId: studentScope(user),
      });
    },

    getById(user: SessionUser, id: string) {
      return repository.getById(id, {
        canSeeAll: isGlobalScope(user) || user.roles.includes("external_expert"),
        hubId: hubScope(user),
        institutionId: institutionScope(user),
        studentId: studentScope(user),
      });
    },
  };
}
