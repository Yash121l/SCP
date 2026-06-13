export type Permission = "manage" | "approve" | "reports" | "documents" | "audit";

export type Role = {
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

export type Approval = {
  id: string;
  title: string;
  module: string;
  owner: string;
  requester_role: string;
  status: string;
  priority: string;
  age: string;
};

export type ResourceDoc = {
  id: string;
  title: string;
  type: string;
  version: string;
  audience: string;
  owner: string;
  access: string;
  updated_at: string;
};

export type Report = {
  id: string;
  name: string;
  cadence: string;
  owner: string;
  status: string;
  coverage: number;
  generated_count: number;
};

export type AuditEvent = {
  id: number;
  actor: string;
  role: string;
  event: string;
  module: string;
  created_at: string;
};

export type Dashboard = {
  role: Role;
  metrics: {
    incubators: number;
    schools: number;
    students: number;
    projects: number;
    reviews: number;
    approvals: number;
    health: number;
  };
  milestones: Array<{ label: string; done: number; status: string }>;
  nextActions: Project[];
  approvals: Approval[];
};
