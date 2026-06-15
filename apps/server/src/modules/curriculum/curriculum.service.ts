import type { SessionUser } from "@scp/contracts";
import { hubScope, institutionScope, isGlobalScope, studentScope } from "../access/scope.js";
import type { AuditService } from "../audit/audit.service.js";
import type { createCurriculumRepository } from "./curriculum.repository.js";
import type {
  CurriculumAssignmentUpdateInput,
  CurriculumLearnerUpdateInput,
  CurriculumStageUpdateInput,
} from "./curriculum.schemas.js";

export type CurriculumService = ReturnType<typeof createCurriculumService>;

export function createCurriculumService({
  audit,
  repository,
}: {
  audit: AuditService;
  repository: ReturnType<typeof createCurriculumRepository>;
}) {
  function scope(user: SessionUser) {
    return {
      canSeeAll: isGlobalScope(user) || user.roles.includes("external_expert"),
      hubId: hubScope(user),
      institutionId: institutionScope(user),
      studentId: studentScope(user),
    };
  }

  function manageScope(user: SessionUser) {
    return {
      canSeeAll: isGlobalScope(user),
      hubId: hubScope(user),
      institutionId: null,
      studentId: null,
    };
  }

  return {
    list(user: SessionUser) {
      return repository.list(scope(user));
    },

    getById(user: SessionUser, id: string) {
      return repository.getById(id, scope(user));
    },

    async updateAssignment(user: SessionUser, id: string, input: CurriculumAssignmentUpdateInput) {
      const curriculum = await repository.updateAssignment(id, input, manageScope(user));

      if (curriculum) {
        await audit.write({
          action: "Updated curriculum assignment",
          actor: user,
          entityId: curriculum.id,
          entityType: "curriculum",
          metadata: {
            fields: Object.keys(input),
            moduleCode: curriculum.moduleCode,
            status: curriculum.status,
          },
        });
      }

      return curriculum;
    },

    async updateLearner(user: SessionUser, id: string, input: CurriculumLearnerUpdateInput) {
      const curriculum = await repository.updateLearner(id, input, manageScope(user));

      if (curriculum) {
        await audit.write({
          action: "Updated curriculum learner evidence",
          actor: user,
          entityId: id,
          entityType: "curriculum_learner",
          metadata: {
            assignmentId: curriculum.id,
            fields: Object.keys(input),
            moduleCode: curriculum.moduleCode,
          },
        });
      }

      return curriculum;
    },

    async updateStage(user: SessionUser, id: string, input: CurriculumStageUpdateInput) {
      const curriculum = await repository.updateStage(id, input, manageScope(user));

      if (curriculum) {
        await audit.write({
          action: "Updated curriculum stage",
          actor: user,
          entityId: id,
          entityType: "curriculum_stage",
          metadata: {
            assignmentId: curriculum.id,
            fields: Object.keys(input),
            moduleCode: curriculum.moduleCode,
          },
        });
      }

      return curriculum;
    },
  };
}
