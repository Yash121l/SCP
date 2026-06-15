import type { Institution, SessionUser } from "@scp/contracts";
import type { AuditService } from "../audit/audit.service.js";
import { hubScope, institutionScope, isGlobalScope } from "../access/scope.js";
import type { createInstitutionRepository } from "./institutions.repository.js";
import type { InstitutionCreateInput, InstitutionStatusInput, InstitutionUpdateInput } from "./institutions.schemas.js";

export type InstitutionService = ReturnType<typeof createInstitutionService>;

export function createInstitutionService({
  audit,
  repository,
}: {
  audit: AuditService;
  repository: ReturnType<typeof createInstitutionRepository>;
}) {
  return {
    async create(user: SessionUser, input: InstitutionCreateInput): Promise<Institution> {
      const scopedHubId = hubScope(user);
      const institution = await repository.create({
        ...input,
        hubId: scopedHubId ?? input.hubId,
      });

      await audit.write({
        action: "Created school",
        actor: user,
        entityId: institution.id,
        entityType: "institution",
        metadata: { name: institution.name, type: institution.type },
      });

      return institution;
    },

    list(user: SessionUser): Promise<Institution[]> {
      return repository.list({
        canSeeAll: isGlobalScope(user),
        hubId: hubScope(user),
        institutionId: institutionScope(user),
      });
    },

    getById(user: SessionUser, id: string) {
      return repository.getById(id, {
        canSeeAll: isGlobalScope(user),
        hubId: hubScope(user),
        institutionId: institutionScope(user),
      });
    },

    async updateStatus(
      user: SessionUser,
      id: string,
      input: InstitutionStatusInput,
    ): Promise<Institution | null> {
      const institution = await repository.updateStatus(id, input);

      if (institution) {
        await audit.write({
          action: "Updated school status",
          actor: user,
          entityId: institution.id,
          entityType: "institution",
          metadata: { status: input.status },
        });
      }

      return institution;
    },

    async remove(user: SessionUser, id: string): Promise<Institution | null> {
      const existing = await this.getById(user, id);
      if (!existing) {
        return null;
      }

      const institution = await repository.archive(id);
      if (institution) {
        await audit.write({
          action: "Archived school",
          actor: user,
          entityId: institution.id,
          entityType: "institution",
          metadata: { name: institution.name },
        });
      }

      return institution;
    },

    async update(
      user: SessionUser,
      id: string,
      input: InstitutionUpdateInput,
    ): Promise<Institution | null> {
      const existing = await this.getById(user, id);
      if (!existing) {
        return null;
      }

      const scopedHubId = hubScope(user);
      if (input.hubId && scopedHubId && input.hubId !== scopedHubId) {
        const error = new Error("School is outside the current incubator scope");
        Object.assign(error, { statusCode: 403, code: "OUT_OF_SCOPE" });
        throw error;
      }

      const institution = await repository.update(id, {
        ...input,
        hubId: scopedHubId ?? input.hubId,
      });

      if (institution) {
        await audit.write({
          action: "Updated school",
          actor: user,
          entityId: institution.id,
          entityType: "institution",
          metadata: { fields: Object.keys(input), name: institution.name },
        });
      }

      return institution;
    },
  };
}
