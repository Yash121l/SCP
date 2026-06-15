import {
  externalExperts,
  projectFeedback,
  studentProjects,
  type DatabaseClient,
} from "@scp/database";
import type { ExternalExpert, ProjectFeedback } from "@scp/contracts";
import { desc, eq } from "drizzle-orm";
import type { ProjectFeedbackInput } from "./experts.schemas.js";

type FeedbackRow = {
  createdAt: Date;
  expertId: string | null;
  expertName: string;
  expertOrganization: string;
  id: string;
  note: string;
  projectId: string;
  projectTitle: string;
  rating: number;
};

function toFeedback(row: FeedbackRow): ProjectFeedback {
  return {
    ...row,
    createdAt: row.createdAt.toISOString(),
  };
}

export function createExpertRepository(db: DatabaseClient) {
  function feedbackSelect() {
    return db
      .select({
        createdAt: projectFeedback.createdAt,
        expertId: projectFeedback.expertId,
        expertName: projectFeedback.expertName,
        expertOrganization: projectFeedback.expertOrganization,
        id: projectFeedback.id,
        note: projectFeedback.note,
        projectId: projectFeedback.projectId,
        projectTitle: studentProjects.title,
        rating: projectFeedback.rating,
      })
      .from(projectFeedback)
      .innerJoin(studentProjects, eq(projectFeedback.projectId, studentProjects.id));
  }

  return {
    async findExpertByUserId(userId: string): Promise<ExternalExpert | null> {
      const [expert] = await db
        .select({
          email: externalExperts.email,
          focusArea: externalExperts.focusArea,
          id: externalExperts.id,
          name: externalExperts.name,
          organization: externalExperts.organization,
          status: externalExperts.status,
        })
        .from(externalExperts)
        .where(eq(externalExperts.userId, userId))
        .limit(1);

      return expert ?? null;
    },

    async list(): Promise<ExternalExpert[]> {
      return db
        .select({
          email: externalExperts.email,
          focusArea: externalExperts.focusArea,
          id: externalExperts.id,
          name: externalExperts.name,
          organization: externalExperts.organization,
          status: externalExperts.status,
        })
        .from(externalExperts)
        .orderBy(externalExperts.name)
        .limit(200);
    },

    async listFeedback(projectId?: string): Promise<ProjectFeedback[]> {
      const rows = await feedbackSelect()
        .where(projectId ? eq(projectFeedback.projectId, projectId) : undefined)
        .orderBy(desc(projectFeedback.createdAt))
        .limit(500);

      return rows.map(toFeedback);
    },

    async createFeedback(input: ProjectFeedbackInput & {
      actorUserId: string;
      expertName: string;
      expertOrganization: string;
      projectId: string;
    }): Promise<ProjectFeedback> {
      const [feedback] = await db
        .insert(projectFeedback)
        .values({
          actorUserId: input.actorUserId,
          expertId: input.expertId,
          expertName: input.expertName,
          expertOrganization: input.expertOrganization,
          note: input.note,
          projectId: input.projectId,
          rating: input.rating,
        })
        .returning({ id: projectFeedback.id });

      if (!feedback) {
        throw new Error("Feedback was not created");
      }

      const [row] = await feedbackSelect().where(eq(projectFeedback.id, feedback.id)).limit(1);
      if (!row) {
        throw new Error("Feedback was not loaded after creation");
      }

      return toFeedback(row);
    },
  };
}
