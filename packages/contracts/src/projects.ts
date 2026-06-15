import type { ProjectFeedback } from "./experts.js";

export type ProjectStatus =
  | "proposed"
  | "under_review"
  | "approved"
  | "in_progress"
  | "on_hold"
  | "completed"
  | "rejected";

export type StudentProject = {
  approvalId: string | null;
  createdAt: string;
  domain: string;
  hubId: string;
  hubName: string;
  id: string;
  institutionId: string;
  institutionName: string;
  ownerEmail: string;
  ownerName: string;
  problemStatement: string;
  reviewNote: string | null;
  solutionSummary: string;
  status: ProjectStatus;
  studentId: string | null;
  studentName: string | null;
  title: string;
  updatedAt: string;
};

export type StudentProjectDetail = StudentProject & {
  feedback: ProjectFeedback[];
};

export type ProjectCreatePayload = {
  domain: string;
  institutionId?: string;
  ownerEmail?: string;
  ownerName?: string;
  problemStatement: string;
  solutionSummary: string;
  studentId?: string | null;
  title: string;
};

export type ProjectStatusPayload = {
  reviewNote?: string;
  status: ProjectStatus;
};
