import type { SessionUser } from "@scp/contracts";
import type { AuditService } from "../audit/audit.service.js";
import { hubScope, institutionScope, isGlobalScope, studentScope } from "../access/scope.js";
import type { createStudentRepository } from "./students.repository.js";
import type { StudentCreateInput, StudentUpdateInput } from "./students.schemas.js";

export type StudentService = ReturnType<typeof createStudentService>;

export function createStudentService({
  audit,
  repository,
}: {
  audit: AuditService;
  repository: ReturnType<typeof createStudentRepository>;
}) {
  return {
    async create(user: SessionUser, input: StudentCreateInput) {
      const hubId = await repository.getInstitutionHubId(input.institutionId);
      const scopedHubId = hubScope(user);
      const scopedInstitutionId = institutionScope(user);

      if (
        !hubId ||
        (scopedHubId && scopedHubId !== hubId) ||
        (scopedInstitutionId && scopedInstitutionId !== input.institutionId)
      ) {
        const error = new Error("School is outside the current incubator or school scope");
        Object.assign(error, { statusCode: 403, code: "OUT_OF_SCOPE" });
        throw error;
      }

      const student = await repository.create({
        ...input,
        hubId,
      });

      await audit.write({
        action: "Created student record",
        actor: user,
        entityId: student.id,
        entityType: "student",
        metadata: { institutionId: student.institutionId },
      });

      return student;
    },

    getById(user: SessionUser, id: string) {
      return repository.getById(id, {
        canSeeAll: isGlobalScope(user),
        hubId: hubScope(user),
        institutionId: institutionScope(user),
        studentId: studentScope(user),
      });
    },

    list(user: SessionUser) {
      return repository.list({
        canSeeAll: isGlobalScope(user),
        hubId: hubScope(user),
        institutionId: institutionScope(user),
        studentId: studentScope(user),
      });
    },

    async remove(user: SessionUser, id: string) {
      const existing = await this.getById(user, id);
      if (!existing) {
        return null;
      }

      const student = await repository.remove(id);
      if (student) {
        await audit.write({
          action: "Deleted student record",
          actor: user,
          entityId: student.id,
          entityType: "student",
          metadata: { email: student.email, name: student.name },
        });
      }

      return student;
    },

    async update(user: SessionUser, id: string, input: StudentUpdateInput) {
      const existing = await this.getById(user, id);
      if (!existing) {
        return null;
      }

      const targetInstitutionId = input.institutionId ?? existing.institutionId;
      const hubId = await repository.getInstitutionHubId(targetInstitutionId);
      const scopedHubId = hubScope(user);
      const scopedInstitutionId = institutionScope(user);
      const scopedStudentId = studentScope(user);

      if (
        !hubId ||
        (scopedHubId && scopedHubId !== hubId) ||
        (scopedInstitutionId && scopedInstitutionId !== targetInstitutionId) ||
        (scopedStudentId && scopedStudentId !== id)
      ) {
        const error = new Error("Student is outside the current workspace scope");
        Object.assign(error, { statusCode: 403, code: "OUT_OF_SCOPE" });
        throw error;
      }

      const student = await repository.update(id, {
        ...input,
        hubId,
      });

      if (student) {
        await audit.write({
          action: "Updated student record",
          actor: user,
          entityId: student.id,
          entityType: "student",
          metadata: { fields: Object.keys(input), name: student.name },
        });
      }

      return student;
    },
  };
}
