export type ExternalExpert = {
  id: string;
  name: string;
  email: string;
  organization: string;
  focusArea: string;
  status: "active" | "invited" | "suspended";
};

export type ProjectFeedback = {
  id: string;
  createdAt: string;
  expertId: string | null;
  expertName: string;
  expertOrganization: string;
  note: string;
  projectId: string;
  projectTitle: string;
  rating: number;
};

export type ProjectFeedbackPayload = {
  expertId?: string | null;
  note: string;
  rating: number;
};
