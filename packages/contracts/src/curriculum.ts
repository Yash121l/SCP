export type CurriculumModule = {
  id: string;
  code: string;
  title: string;
  domain: string;
  gradeBand: string;
  sessionCount: number;
};

export type CurriculumDeliveryStatus = "planned" | "active" | "at_risk" | "completed";
export type CurriculumLearnerStatus = "not_started" | "in_progress" | "completed";

export type CurriculumAssignment = {
  id: string;
  completedSessions: number;
  completionPercent: number;
  domain: string;
  gradeBand: string;
  hubId: string;
  hubName: string;
  moduleCode: string;
  moduleId: string;
  moduleTitle: string;
  nextTopic: string;
  ownerEmployeeId: string | null;
  ownerEmployeeName: string | null;
  plannedSessions: number;
  projectCount: number;
  stageCount: number;
  status: CurriculumDeliveryStatus;
  studentCount: number;
};

export type CurriculumStageLearner = {
  evidenceNote: string;
  id: string;
  projectId: string | null;
  projectTitle: string | null;
  status: CurriculumLearnerStatus;
  studentGrade: string;
  studentId: string;
  studentName: string;
};

export type CurriculumStage = {
  id: string;
  completedSessions: number;
  completionPercent: number;
  learners: CurriculumStageLearner[];
  nextTopic: string;
  plannedSessions: number;
  projectCount: number;
  sequence: number;
  status: CurriculumDeliveryStatus;
  studentCount: number;
  title: string;
};

export type CurriculumDetail = CurriculumAssignment & {
  stages: CurriculumStage[];
};

export type CurriculumProgress = CurriculumAssignment;
