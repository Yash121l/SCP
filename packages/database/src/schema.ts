import { relations } from "drizzle-orm";
import {
  date,
  doublePrecision,
  integer,
  jsonb,
  numeric,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";

export const organizationType = pgEnum("organization_type", [
  "government",
  "steering_committee",
  "hub",
  "institution",
  "partner",
]);

export const userStatus = pgEnum("user_status", ["active", "invited", "suspended"]);
export const hubStatus = pgEnum("hub_status", ["active", "onboarding", "attention", "archived"]);
export const institutionType = pgEnum("institution_type", ["school", "college", "polytechnic", "iti"]);
export const institutionStatus = pgEnum("institution_status", [
  "active",
  "onboarding",
  "attention",
  "archived",
]);
export const employeeStatus = pgEnum("employee_status", ["active", "invited", "suspended"]);
export const expertStatus = pgEnum("expert_status", ["active", "invited", "suspended"]);
export const studentStatus = pgEnum("student_status", ["active", "paused", "graduated"]);
export const projectStatus = pgEnum("project_status", [
  "proposed",
  "under_review",
  "approved",
  "in_progress",
  "on_hold",
  "completed",
  "rejected",
]);
export const approvalStatus = pgEnum("approval_status", [
  "pending",
  "returned",
  "approved",
  "rejected",
]);
export const curriculumDeliveryStatus = pgEnum("curriculum_delivery_status", [
  "planned",
  "active",
  "at_risk",
  "completed",
]);
export const curriculumLearnerStatus = pgEnum("curriculum_learner_status", [
  "not_started",
  "in_progress",
  "completed",
]);

export const organizations = pgTable("organizations", {
  id: uuid("id").primaryKey().defaultRandom(),
  slug: text("slug").notNull().unique(),
  name: text("name").notNull(),
  type: organizationType("type").notNull(),
  region: text("region").notNull().default("State-wide"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const users = pgTable("users", {
  id: uuid("id").primaryKey().defaultRandom(),
  email: text("email").notNull().unique(),
  name: text("name").notNull(),
  passwordHash: text("password_hash").notNull(),
  status: userStatus("status").notNull().default("active"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const incubationHubs = pgTable(
  "incubation_hubs",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    organizationId: uuid("organization_id")
      .notNull()
      .references(() => organizations.id, { onDelete: "cascade" }),
    leadUserId: uuid("lead_user_id").references(() => users.id, { onDelete: "set null" }),
    code: text("code").notNull(),
    name: text("name").notNull(),
    region: text("region").notNull(),
    district: text("district").notNull(),
    latitude: doublePrecision("latitude").notNull().default(0),
    longitude: doublePrecision("longitude").notNull().default(0),
    geographyNote: text("geography_note").notNull().default("Geography pending"),
    performanceScore: integer("performance_score").notNull().default(0),
    status: hubStatus("status").notNull().default("onboarding"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    uniqueIndex("incubation_hubs_code_idx").on(table.code),
    uniqueIndex("incubation_hubs_org_idx").on(table.organizationId),
  ],
);

export const userRoles = pgTable(
  "user_roles",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    organizationId: uuid("organization_id").references(() => organizations.id, {
      onDelete: "set null",
    }),
    role: text("role").notNull(),
    scopeLabel: text("scope_label").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [uniqueIndex("user_roles_unique_idx").on(table.userId, table.role, table.organizationId)],
);

export const institutions = pgTable(
  "institutions",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    organizationId: uuid("organization_id").references(() => organizations.id, {
      onDelete: "set null",
    }),
    hubId: uuid("hub_id")
      .notNull()
      .references(() => incubationHubs.id, { onDelete: "restrict" }),
    code: text("code").notNull(),
    name: text("name").notNull(),
    type: institutionType("type").notNull(),
    region: text("region").notNull(),
    district: text("district").notNull(),
    address: text("address").notNull().default("Address pending"),
    latitude: doublePrecision("latitude").notNull().default(0),
    longitude: doublePrecision("longitude").notNull().default(0),
    geographyNote: text("geography_note").notNull().default("Geography pending"),
    performanceScore: integer("performance_score").notNull().default(0),
    principalName: text("principal_name").notNull().default("Principal pending"),
    contactEmail: text("contact_email").notNull(),
    status: institutionStatus("status").notNull().default("onboarding"),
    employeeCount: integer("employee_count").notNull().default(0),
    studentCount: integer("student_count").notNull().default(0),
    projectCount: integer("project_count").notNull().default(0),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    uniqueIndex("institutions_code_idx").on(table.code),
    uniqueIndex("institutions_unique_idx").on(table.name, table.hubId, table.district),
  ],
);

export const hubEmployees = pgTable(
  "hub_employees",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    hubId: uuid("hub_id")
      .notNull()
      .references(() => incubationHubs.id, { onDelete: "cascade" }),
    institutionId: uuid("institution_id").references(() => institutions.id, { onDelete: "set null" }),
    userId: uuid("user_id").references(() => users.id, { onDelete: "set null" }),
    name: text("name").notNull(),
    email: text("email").notNull(),
    designation: text("designation").notNull(),
    phone: text("phone").notNull().default(""),
    status: employeeStatus("status").notNull().default("active"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [uniqueIndex("hub_employees_email_idx").on(table.email)],
);

export const students = pgTable(
  "students",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    hubId: uuid("hub_id")
      .notNull()
      .references(() => incubationHubs.id, { onDelete: "cascade" }),
    institutionId: uuid("institution_id")
      .notNull()
      .references(() => institutions.id, { onDelete: "cascade" }),
    mentorEmployeeId: uuid("mentor_employee_id").references(() => hubEmployees.id, { onDelete: "set null" }),
    userId: uuid("user_id").references(() => users.id, { onDelete: "set null" }),
    name: text("name").notNull(),
    email: text("email").notNull(),
    grade: text("grade").notNull(),
    status: studentStatus("status").notNull().default("active"),
    projectCount: integer("project_count").notNull().default(0),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [uniqueIndex("students_email_idx").on(table.email)],
);

export const approvals = pgTable(
  "approvals",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    title: text("title").notNull(),
    module: text("module").notNull(),
    owner: text("owner").notNull(),
    status: approvalStatus("status").notNull().default("pending"),
    assignedRole: text("assigned_role").notNull(),
    dueAt: date("due_at").notNull(),
    organizationId: uuid("organization_id").references(() => organizations.id, {
      onDelete: "set null",
    }),
    createdByUserId: uuid("created_by_user_id").references(() => users.id, {
      onDelete: "set null",
    }),
    decidedByUserId: uuid("decided_by_user_id").references(() => users.id, {
      onDelete: "set null",
    }),
    decisionNote: text("decision_note"),
    decidedAt: timestamp("decided_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [uniqueIndex("approvals_unique_idx").on(table.title, table.module, table.owner)],
);

export const studentProjects = pgTable(
  "student_projects",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    hubId: uuid("hub_id")
      .notNull()
      .references(() => incubationHubs.id, { onDelete: "cascade" }),
    institutionId: uuid("institution_id")
      .notNull()
      .references(() => institutions.id, { onDelete: "cascade" }),
    studentId: uuid("student_id").references(() => students.id, { onDelete: "set null" }),
    approvalId: uuid("approval_id").references(() => approvals.id, { onDelete: "set null" }),
    createdByUserId: uuid("created_by_user_id").references(() => users.id, { onDelete: "set null" }),
    updatedByUserId: uuid("updated_by_user_id").references(() => users.id, { onDelete: "set null" }),
    title: text("title").notNull(),
    domain: text("domain").notNull(),
    ownerName: text("owner_name").notNull(),
    ownerEmail: text("owner_email").notNull(),
    problemStatement: text("problem_statement").notNull(),
    solutionSummary: text("solution_summary").notNull(),
    status: projectStatus("status").notNull().default("proposed"),
    reviewNote: text("review_note"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    uniqueIndex("student_projects_unique_idx").on(
      table.title,
      table.institutionId,
      table.ownerEmail,
    ),
  ],
);

export const curriculumModules = pgTable(
  "curriculum_modules",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    code: text("code").notNull(),
    title: text("title").notNull(),
    domain: text("domain").notNull(),
    gradeBand: text("grade_band").notNull(),
    sessionCount: integer("session_count").notNull().default(0),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [uniqueIndex("curriculum_modules_code_idx").on(table.code)],
);

export const curriculumProgress = pgTable(
  "curriculum_progress",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    hubId: uuid("hub_id")
      .notNull()
      .references(() => incubationHubs.id, { onDelete: "cascade" }),
    institutionId: uuid("institution_id")
      .notNull()
      .references(() => institutions.id, { onDelete: "cascade" }),
    moduleId: uuid("module_id")
      .notNull()
      .references(() => curriculumModules.id, { onDelete: "cascade" }),
    plannedSessions: integer("planned_sessions").notNull().default(0),
    completedSessions: integer("completed_sessions").notNull().default(0),
    nextTopic: text("next_topic").notNull().default("Session planning pending"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    uniqueIndex("curriculum_progress_unique_idx").on(table.institutionId, table.moduleId),
  ],
);

export const curriculumAssignments = pgTable(
  "curriculum_assignments",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    hubId: uuid("hub_id")
      .notNull()
      .references(() => incubationHubs.id, { onDelete: "cascade" }),
    moduleId: uuid("module_id")
      .notNull()
      .references(() => curriculumModules.id, { onDelete: "cascade" }),
    ownerEmployeeId: uuid("owner_employee_id").references(() => hubEmployees.id, {
      onDelete: "set null",
    }),
    status: curriculumDeliveryStatus("status").notNull().default("planned"),
    plannedSessions: integer("planned_sessions").notNull().default(0),
    completedSessions: integer("completed_sessions").notNull().default(0),
    nextTopic: text("next_topic").notNull().default("Session planning pending"),
    startsOn: date("starts_on"),
    endsOn: date("ends_on"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [uniqueIndex("curriculum_assignments_unique_idx").on(table.hubId, table.moduleId)],
);

export const curriculumStages = pgTable(
  "curriculum_stages",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    assignmentId: uuid("assignment_id")
      .notNull()
      .references(() => curriculumAssignments.id, { onDelete: "cascade" }),
    title: text("title").notNull(),
    sequence: integer("sequence").notNull(),
    plannedSessions: integer("planned_sessions").notNull().default(0),
    completedSessions: integer("completed_sessions").notNull().default(0),
    status: curriculumDeliveryStatus("status").notNull().default("planned"),
    nextTopic: text("next_topic").notNull().default("Session planning pending"),
    detail: text("detail").notNull().default(""),
    attachmentUrl: text("attachment_url"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [uniqueIndex("curriculum_stages_unique_idx").on(table.assignmentId, table.sequence)],
);

export const curriculumStageStudents = pgTable(
  "curriculum_stage_students",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    stageId: uuid("stage_id")
      .notNull()
      .references(() => curriculumStages.id, { onDelete: "cascade" }),
    studentId: uuid("student_id")
      .notNull()
      .references(() => students.id, { onDelete: "cascade" }),
    projectId: uuid("project_id").references(() => studentProjects.id, { onDelete: "set null" }),
    status: curriculumLearnerStatus("status").notNull().default("not_started"),
    evidenceNote: text("evidence_note").notNull().default(""),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [uniqueIndex("curriculum_stage_students_unique_idx").on(table.stageId, table.studentId)],
);

export const externalExperts = pgTable(
  "external_experts",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    organizationId: uuid("organization_id").references(() => organizations.id, {
      onDelete: "set null",
    }),
    userId: uuid("user_id").references(() => users.id, { onDelete: "set null" }),
    name: text("name").notNull(),
    email: text("email").notNull(),
    organization: text("organization").notNull(),
    focusArea: text("focus_area").notNull(),
    status: expertStatus("status").notNull().default("invited"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [uniqueIndex("external_experts_email_idx").on(table.email)],
);

export const projectFeedback = pgTable("project_feedback", {
  id: uuid("id").primaryKey().defaultRandom(),
  projectId: uuid("project_id")
    .notNull()
    .references(() => studentProjects.id, { onDelete: "cascade" }),
  expertId: uuid("expert_id").references(() => externalExperts.id, { onDelete: "set null" }),
  actorUserId: uuid("actor_user_id").references(() => users.id, { onDelete: "set null" }),
  expertName: text("expert_name").notNull(),
  expertOrganization: text("expert_organization").notNull(),
  rating: integer("rating").notNull().default(3),
  note: text("note").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const indicators = pgTable("indicators", {
  id: uuid("id").primaryKey().defaultRandom(),
  label: text("label").notNull().unique(),
  value: numeric("value").notNull(),
  target: numeric("target").notNull(),
  unit: text("unit").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const notifications = pgTable("notifications", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id").references(() => users.id, { onDelete: "cascade" }),
  role: text("role"),
  title: text("title").notNull(),
  body: text("body").notNull(),
  readAt: timestamp("read_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const auditLogs = pgTable("audit_logs", {
  id: uuid("id").primaryKey().defaultRandom(),
  actorUserId: uuid("actor_user_id").references(() => users.id, { onDelete: "set null" }),
  actorName: text("actor_name").notNull(),
  action: text("action").notNull(),
  entityType: text("entity_type").notNull(),
  entityId: text("entity_id").notNull(),
  metadata: jsonb("metadata").notNull().default({}),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const organizationRelations = relations(organizations, ({ many }) => ({
  hubs: many(incubationHubs),
  institutions: many(institutions),
  roles: many(userRoles),
}));

export const userRelations = relations(users, ({ many }) => ({
  auditLogs: many(auditLogs),
  notifications: many(notifications),
  roles: many(userRoles),
}));

export const hubRelations = relations(incubationHubs, ({ many, one }) => ({
  curriculumAssignments: many(curriculumAssignments),
  employees: many(hubEmployees),
  institutions: many(institutions),
  leadUser: one(users, {
    fields: [incubationHubs.leadUserId],
    references: [users.id],
  }),
  organization: one(organizations, {
    fields: [incubationHubs.organizationId],
    references: [organizations.id],
  }),
  projects: many(studentProjects),
  students: many(students),
}));

export const userRoleRelations = relations(userRoles, ({ one }) => ({
  organization: one(organizations, {
    fields: [userRoles.organizationId],
    references: [organizations.id],
  }),
  user: one(users, {
    fields: [userRoles.userId],
    references: [users.id],
  }),
}));

export const institutionRelations = relations(institutions, ({ many, one }) => ({
  employees: many(hubEmployees),
  hub: one(incubationHubs, {
    fields: [institutions.hubId],
    references: [incubationHubs.id],
  }),
  organization: one(organizations, {
    fields: [institutions.organizationId],
    references: [organizations.id],
  }),
  projects: many(studentProjects),
  students: many(students),
}));

export const employeeRelations = relations(hubEmployees, ({ one }) => ({
  hub: one(incubationHubs, {
    fields: [hubEmployees.hubId],
    references: [incubationHubs.id],
  }),
  institution: one(institutions, {
    fields: [hubEmployees.institutionId],
    references: [institutions.id],
  }),
  user: one(users, {
    fields: [hubEmployees.userId],
    references: [users.id],
  }),
}));

export const studentRelations = relations(students, ({ one }) => ({
  hub: one(incubationHubs, {
    fields: [students.hubId],
    references: [incubationHubs.id],
  }),
  institution: one(institutions, {
    fields: [students.institutionId],
    references: [institutions.id],
  }),
  mentor: one(hubEmployees, {
    fields: [students.mentorEmployeeId],
    references: [hubEmployees.id],
  }),
  user: one(users, {
    fields: [students.userId],
    references: [users.id],
  }),
}));

export const projectRelations = relations(studentProjects, ({ one }) => ({
  approval: one(approvals, {
    fields: [studentProjects.approvalId],
    references: [approvals.id],
  }),
  createdBy: one(users, {
    fields: [studentProjects.createdByUserId],
    references: [users.id],
  }),
  hub: one(incubationHubs, {
    fields: [studentProjects.hubId],
    references: [incubationHubs.id],
  }),
  institution: one(institutions, {
    fields: [studentProjects.institutionId],
    references: [institutions.id],
  }),
  student: one(students, {
    fields: [studentProjects.studentId],
    references: [students.id],
  }),
  updatedBy: one(users, {
    fields: [studentProjects.updatedByUserId],
    references: [users.id],
  }),
}));

export const curriculumModuleRelations = relations(curriculumModules, ({ many }) => ({
  assignments: many(curriculumAssignments),
  progress: many(curriculumProgress),
}));

export const curriculumProgressRelations = relations(curriculumProgress, ({ one }) => ({
  hub: one(incubationHubs, {
    fields: [curriculumProgress.hubId],
    references: [incubationHubs.id],
  }),
  institution: one(institutions, {
    fields: [curriculumProgress.institutionId],
    references: [institutions.id],
  }),
  module: one(curriculumModules, {
    fields: [curriculumProgress.moduleId],
    references: [curriculumModules.id],
  }),
}));

export const curriculumAssignmentRelations = relations(curriculumAssignments, ({ many, one }) => ({
  hub: one(incubationHubs, {
    fields: [curriculumAssignments.hubId],
    references: [incubationHubs.id],
  }),
  module: one(curriculumModules, {
    fields: [curriculumAssignments.moduleId],
    references: [curriculumModules.id],
  }),
  ownerEmployee: one(hubEmployees, {
    fields: [curriculumAssignments.ownerEmployeeId],
    references: [hubEmployees.id],
  }),
  stages: many(curriculumStages),
}));

export const curriculumStageRelations = relations(curriculumStages, ({ many, one }) => ({
  assignment: one(curriculumAssignments, {
    fields: [curriculumStages.assignmentId],
    references: [curriculumAssignments.id],
  }),
  learners: many(curriculumStageStudents),
}));

export const curriculumStageStudentRelations = relations(curriculumStageStudents, ({ one }) => ({
  project: one(studentProjects, {
    fields: [curriculumStageStudents.projectId],
    references: [studentProjects.id],
  }),
  stage: one(curriculumStages, {
    fields: [curriculumStageStudents.stageId],
    references: [curriculumStages.id],
  }),
  student: one(students, {
    fields: [curriculumStageStudents.studentId],
    references: [students.id],
  }),
}));

export const expertRelations = relations(externalExperts, ({ one, many }) => ({
  feedback: many(projectFeedback),
  organizationRecord: one(organizations, {
    fields: [externalExperts.organizationId],
    references: [organizations.id],
  }),
  user: one(users, {
    fields: [externalExperts.userId],
    references: [users.id],
  }),
}));

export const projectFeedbackRelations = relations(projectFeedback, ({ one }) => ({
  expert: one(externalExperts, {
    fields: [projectFeedback.expertId],
    references: [externalExperts.id],
  }),
  project: one(studentProjects, {
    fields: [projectFeedback.projectId],
    references: [studentProjects.id],
  }),
}));

export const approvalRelations = relations(approvals, ({ one }) => ({
  createdBy: one(users, {
    fields: [approvals.createdByUserId],
    references: [users.id],
  }),
  decidedBy: one(users, {
    fields: [approvals.decidedByUserId],
    references: [users.id],
  }),
  organization: one(organizations, {
    fields: [approvals.organizationId],
    references: [organizations.id],
  }),
}));
