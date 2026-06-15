import { userHasPermission, type DashboardSummary, type Kpi, type SessionUser } from "@scp/contracts";
import type { AuditService } from "../audit/audit.service.js";
import type { CurriculumService } from "../curriculum/curriculum.service.js";
import type { ExpertService } from "../experts/experts.service.js";
import type { GovernanceService } from "../governance/governance.service.js";
import type { HubService } from "../hubs/hubs.service.js";
import type { InstitutionService } from "../institutions/institutions.service.js";
import type { NotificationService } from "../notifications/notifications.service.js";
import type { PeopleService } from "../people/people.service.js";
import type { ProjectService } from "../projects/projects.service.js";
import type { StudentService } from "../students/students.service.js";
import type { createIndicatorRepository } from "./indicator.repository.js";

export function createDashboardService({
  audit,
  curriculum,
  experts,
  governance,
  hubs,
  indicators,
  institutions,
  notifications,
  people,
  projects,
  students,
}: {
  audit: AuditService;
  curriculum: CurriculumService;
  experts: ExpertService;
  governance: GovernanceService;
  hubs: HubService;
  indicators: ReturnType<typeof createIndicatorRepository>;
  institutions: InstitutionService;
  notifications: NotificationService;
  people: PeopleService;
  projects: ProjectService;
  students: StudentService;
}) {
  return {
    async getSummary(user: SessionUser): Promise<DashboardSummary> {
      const [hubRows, institutionRows, employeeRows, studentRows, projectRows, approvalRows, indicatorRows, notificationRows, auditRows, curriculumRows, expertRows, feedbackRows] = await Promise.all([
        userHasPermission(user, "hubs:read") ? hubs.list(user) : [],
        userHasPermission(user, "institutions:read") ? institutions.list(user) : [],
        userHasPermission(user, "people:read") ? people.list(user) : [],
        userHasPermission(user, "students:read") ? students.list(user) : [],
        userHasPermission(user, "projects:read") ? projects.list(user) : [],
        userHasPermission(user, "governance:read") ? governance.listApprovals(user) : [],
        indicators.list(),
        notifications.list(user),
        userHasPermission(user, "audit:read") ? audit.list(8) : [],
        userHasPermission(user, "curriculum:read") ? curriculum.list(user) : [],
        userHasPermission(user, "experts:read") ? experts.list() : [],
        userHasPermission(user, "projects:read") ? experts.listFeedback() : [],
      ]);

      const studentCount = studentRows.length;
      const projectCount = projectRows.length || institutionRows.reduce((sum, institution) => sum + institution.projectCount, 0);
      const pendingApprovals = approvalRows.filter((approval) => approval.status === "pending").length;

      const kpis: Kpi[] = [
        {
          change: "Government to incubator hierarchy",
          label: "Incubators",
          tone: "neutral",
          value: String(hubRows.length),
        },
        {
          change: "Mapped to incubators",
          label: "Schools",
          tone: "neutral",
          value: String(institutionRows.length),
        },
        {
          change: "Role filtered",
          label: "Students",
          tone: "good",
          value: studentCount.toLocaleString("en-IN"),
        },
        {
          change: "Raised and status tracked",
          label: "Projects",
          tone: "neutral",
          value: String(projectCount),
        },
        {
          change: "Maker-checker queue",
          label: "Pending approvals",
          tone: pendingApprovals > 0 ? "warn" : "good",
          value: String(pendingApprovals),
        },
      ];

      return {
        approvals: approvalRows,
        audit: auditRows,
        curriculum: curriculumRows,
        employees: employeeRows,
        experts: expertRows,
        feedback: feedbackRows,
        hubs: hubRows,
        indicators: indicatorRows,
        institutions: institutionRows,
        kpis,
        notifications: notificationRows,
        projects: projectRows,
        students: studentRows,
      };
    },
  };
}
