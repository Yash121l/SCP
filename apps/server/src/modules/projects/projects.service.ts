import type { SessionUser, StudentProject } from "@scp/contracts";
import type { AuditService } from "../audit/audit.service.js";
import { hubScope, institutionScope, isGlobalScope, studentScope } from "../access/scope.js";
import type { GovernanceService } from "../governance/governance.service.js";
import type { createProjectRepository } from "./projects.repository.js";
import type { ProjectCreateInput, ProjectStatusUpdateInput, ProjectUpdateInput } from "./projects.schemas.js";

export type ProjectService = ReturnType<typeof createProjectService>;

function dueInSevenDays() {
  return new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
}

function outOfScope() {
  const error = new Error("Project is outside the current workspace scope");
  Object.assign(error, { statusCode: 403, code: "OUT_OF_SCOPE" });
  return error;
}

export function createProjectService({
  audit,
  governance,
  repository,
}: {
  audit: AuditService;
  governance: GovernanceService;
  repository: ReturnType<typeof createProjectRepository>;
}) {
  function scope(user: SessionUser) {
    return {
      canSeeAll: isGlobalScope(user),
      hubId: hubScope(user),
      institutionId: institutionScope(user),
      studentId: studentScope(user),
    };
  }

  return {
    async create(user: SessionUser, input: ProjectCreateInput): Promise<StudentProject> {
      const target = await repository.resolveTarget({
        institutionId: input.institutionId,
        ownerEmail: input.ownerEmail,
        ownerName: input.ownerName,
        studentId: studentScope(user) ?? input.studentId ?? null,
      });

      if (!target) {
        throw outOfScope();
      }

      const scopedHubId = hubScope(user);
      const scopedInstitutionId = institutionScope(user);
      const scopedStudentId = studentScope(user);

      if (
        (scopedHubId && scopedHubId !== target.hubId) ||
        (scopedInstitutionId && scopedInstitutionId !== target.institutionId) ||
        (scopedStudentId && scopedStudentId !== target.studentId)
      ) {
        throw outOfScope();
      }

      const project = await repository.create({
        ...input,
        ...target,
        createdByUserId: user.id,
      });

      const approval = await governance.createApproval(user, {
        assignedRole: "steering_committee",
        dueAt: dueInSevenDays(),
        module: "Project",
        owner: project.ownerName,
        title: `Review project: ${project.title}`,
      });

      await repository.attachApproval(project.id, approval.id);

      await audit.write({
        action: "Raised project request",
        actor: user,
        entityId: project.id,
        entityType: "project",
        metadata: {
          approvalId: approval.id,
          domain: project.domain,
          institutionId: project.institutionId,
          studentId: project.studentId,
        },
      });

      return {
        ...project,
        approvalId: approval.id,
      };
    },

    getById(user: SessionUser, id: string) {
      return repository.getById(id, scope(user));
    },

    list(user: SessionUser) {
      return repository.list(scope(user));
    },

    async updateStatus(
      user: SessionUser,
      id: string,
      input: ProjectStatusUpdateInput,
    ): Promise<StudentProject | null> {
      const project = await repository.getById(id, scope(user));
      if (!project) {
        return null;
      }

      const updated = await repository.updateStatus(id, {
        ...input,
        updatedByUserId: user.id,
      });

      if (updated) {
        await audit.write({
          action: "Updated project status",
          actor: user,
          entityId: updated.id,
          entityType: "project",
          metadata: {
            reviewNote: input.reviewNote,
            status: input.status,
          },
        });
      }

      return updated;
    },

    async remove(user: SessionUser, id: string): Promise<StudentProject | null> {
      const project = await repository.getById(id, scope(user));
      if (!project) {
        return null;
      }

      const deleted = await repository.remove(id);
      if (deleted) {
        await audit.write({
          action: "Deleted project",
          actor: user,
          entityId: deleted.id,
          entityType: "project",
          metadata: { title: deleted.title },
        });
      }

      return deleted;
    },

    async update(
      user: SessionUser,
      id: string,
      input: ProjectUpdateInput,
    ): Promise<StudentProject | null> {
      const project = await repository.getById(id, scope(user));
      if (!project) {
        return null;
      }

      let target:
        | Awaited<ReturnType<typeof repository.resolveTarget>>
        | undefined;

      if (Object.hasOwn(input, "studentId") || input.institutionId) {
        target = await repository.resolveTarget({
          institutionId: input.institutionId ?? project.institutionId,
          ownerEmail: input.ownerEmail ?? project.ownerEmail,
          ownerName: input.ownerName ?? project.ownerName,
          studentId: input.studentId ?? null,
        });

        if (!target) {
          throw outOfScope();
        }

        const scopedHubId = hubScope(user);
        const scopedInstitutionId = institutionScope(user);
        const scopedStudentId = studentScope(user);

        if (
          (scopedHubId && scopedHubId !== target.hubId) ||
          (scopedInstitutionId && scopedInstitutionId !== target.institutionId) ||
          (scopedStudentId && scopedStudentId !== target.studentId)
        ) {
          throw outOfScope();
        }
      }

      const updated = await repository.update(id, {
        ...input,
        ...(target ?? {}),
        updatedByUserId: user.id,
      });

      if (updated) {
        await audit.write({
          action: "Updated project",
          actor: user,
          entityId: updated.id,
          entityType: "project",
          metadata: { fields: Object.keys(input), title: updated.title },
        });
      }

      return updated;
    },
  };
}
