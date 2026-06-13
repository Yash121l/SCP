export type Permission =
  | "manage"
  | "approve"
  | "reports"
  | "documents"
  | "audit";

export type DemoRole = {
  id: string;
  label: string;
  short_label: string;
  name: string;
  organization: string;
  scope: string;
  accent: string;
  permissions: Permission[];
};

export type Institution = {
  id: string;
  type: "Incubator" | "School";
  name: string;
  region: string;
  owner: string;
  schools: number;
  students: number;
  teachers: number;
  projects: number;
  health: number;
  report_status: string;
  risk: string;
};

export type Project = {
  id: string;
  title: string;
  school: string;
  incubator: string;
  owner: string;
  mentor: string;
  stage: string;
  score: number;
  status: string;
  risk: string;
  next_action: string;
  due_date: string;
};
