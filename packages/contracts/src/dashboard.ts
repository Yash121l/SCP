import type { AuditEntry } from "./audit.js";
import type { ApprovalItem } from "./governance.js";
import type { CurriculumProgress } from "./curriculum.js";
import type { ExternalExpert, ProjectFeedback } from "./experts.js";
import type { IncubationHub } from "./hubs.js";
import type { Institution } from "./institutions.js";
import type { NotificationItem } from "./notifications.js";
import type { HubEmployee } from "./people.js";
import type { StudentProject } from "./projects.js";
import type { StudentRecord } from "./students.js";

export type Kpi = {
  label: string;
  value: string;
  change: string;
  tone: "neutral" | "good" | "warn" | "bad";
};

export type ProgrammeIndicator = {
  label: string;
  value: number;
  target: number;
  unit: string;
};

export type DashboardSummary = {
  kpis: Kpi[];
  indicators: ProgrammeIndicator[];
  approvals: ApprovalItem[];
  hubs: IncubationHub[];
  institutions: Institution[];
  employees: HubEmployee[];
  projects: StudentProject[];
  students: StudentRecord[];
  notifications: NotificationItem[];
  audit: AuditEntry[];
  curriculum: CurriculumProgress[];
  experts: ExternalExpert[];
  feedback: ProjectFeedback[];
};
