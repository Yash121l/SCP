export type StudentStatus = "active" | "paused" | "graduated";

export type StudentRecord = {
  id: string;
  hubId: string;
  hubName: string;
  institutionId: string;
  institutionName: string;
  mentorEmployeeId: string | null;
  name: string;
  email: string;
  grade: string;
  status: StudentStatus;
  projectCount: number;
};

export type StudentDetail = StudentRecord & {
  mentorName: string | null;
};
