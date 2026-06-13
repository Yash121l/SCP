import cors from "@fastify/cors";
import Fastify from "fastify";
import { z } from "zod";
import { config } from "./config.js";
import { pool, query, waitForDatabase } from "./db.js";
import { createSchema } from "./schema.js";
import type { DemoRole, Institution, Permission, Project } from "./types.js";

const app = Fastify({
  logger: true,
});

await app.register(cors, {
  origin: true,
});

const roleQuerySchema = z.object({
  roleId: z.string().min(1),
  search: z.string().optional().default(""),
});

const loginSchema = z.object({
  roleId: z.string().min(1),
});

const reportRunSchema = z.object({
  roleId: z.string().min(1),
  reportId: z.string().min(1).optional(),
});

function containsPermission(role: DemoRole, permission: Permission) {
  return role.permissions.includes(permission);
}

async function findRole(roleId: string) {
  const result = await query<DemoRole>("select * from roles where id = $1", [roleId]);
  return result.rows[0] || null;
}

async function requireRole(roleId: string) {
  const role = await findRole(roleId);
  if (!role) {
    const error = new Error("Unknown demo role") as Error & { statusCode: number };
    error.statusCode = 401;
    throw error;
  }
  return role;
}

async function writeAudit(role: DemoRole, event: string, module: string) {
  await query(
    "insert into audit_events (actor, role, event, module) values ($1, $2, $3, $4)",
    [role.name, role.label, event, module],
  );
}

function searchRows<T extends Record<string, unknown>>(
  rows: T[],
  search: string,
  keys: Array<keyof T>,
) {
  const term = search.trim().toLowerCase();
  if (!term) return rows;
  return rows.filter((row) =>
    keys.some((key) => String(row[key] ?? "").toLowerCase().includes(term)),
  );
}

function scopeInstitutions(role: DemoRole, rows: Institution[]) {
  if (["school-admin", "teacher", "student"].includes(role.id)) {
    return rows.filter((institution) => institution.id === "riverdale");
  }
  if (role.id === "incubator-admin") {
    return rows.filter((institution) => institution.region === "North");
  }
  if (role.id === "funding-partner") {
    return rows.filter((institution) => ["North", "South"].includes(institution.region));
  }
  return rows;
}

function scopeProjects(role: DemoRole, rows: Project[]) {
  if (role.id === "student") {
    return rows.filter((project) => project.owner === "Ananya Das");
  }
  if (["teacher", "school-admin"].includes(role.id)) {
    return rows.filter((project) => project.school === "Riverdale Public School");
  }
  if (role.id === "mentor") {
    return rows.filter((project) => project.mentor === "Vikram Shah");
  }
  if (role.id === "incubator-admin") {
    return rows.filter((project) => project.incubator === "North Innovation Hub");
  }
  if (role.id === "funding-partner") {
    return rows.filter((project) => project.risk !== "High");
  }
  return rows;
}

function scopeApprovals(role: DemoRole, rows: Array<Record<string, unknown>>) {
  if (role.id === "leadership") {
    return rows.filter((approval) =>
      ["Council review", "Escalated"].includes(String(approval.status)),
    );
  }
  if (role.id === "secretariat") {
    return rows.filter((approval) => approval.module === "Governance");
  }
  if (role.id === "incubator-admin") {
    return rows.filter((approval) => approval.requester_role === "Incubator Admin");
  }
  if (!containsPermission(role, "approve")) {
    return rows.slice(0, 1);
  }
  return rows;
}

function scopeResources(role: DemoRole, rows: Array<Record<string, unknown>>) {
  if (role.id === "student") {
    return rows.filter((resource) => resource.type === "Curriculum");
  }
  if (role.id === "mentor") {
    return rows.filter((resource) => ["Evaluation", "Curriculum"].includes(String(resource.type)));
  }
  if (role.id === "funding-partner") {
    return rows.filter((resource) => ["Funding", "Curriculum"].includes(String(resource.type)));
  }
  if (role.id === "secretariat") {
    return rows.filter((resource) => ["Governance", "Curriculum"].includes(String(resource.type)));
  }
  return rows;
}

function dashboardMetrics(
  institutions: Institution[],
  projects: Project[],
  approvals: Array<Record<string, unknown>>,
) {
  const health =
    institutions.reduce((sum, institution) => sum + institution.health, 0) /
    Math.max(institutions.length, 1);

  return {
    incubators: institutions.filter((institution) => institution.type === "Incubator").length,
    schools: institutions.reduce(
      (sum, institution) => sum + (institution.type === "Incubator" ? institution.schools : 1),
      0,
    ),
    students: institutions.reduce((sum, institution) => sum + institution.students, 0),
    projects: projects.length,
    reviews: projects.filter((project) => project.status !== "On track").length,
    approvals: approvals.length,
    health: Math.round(health),
  };
}

app.get("/health", async () => {
  await query("select 1");
  return { ok: true, service: "scp-api" };
});

app.get("/api/roles", async () => {
  const result = await query<DemoRole>("select * from roles order by id");
  return { roles: result.rows };
});

app.post("/api/auth/demo-login", async (request, reply) => {
  const body = loginSchema.parse(request.body);
  const role = await requireRole(body.roleId);
  await writeAudit(role, `opened ${role.label} demo workspace`, "Auth");
  return reply.send({ role });
});

app.get("/api/dashboard", async (request) => {
  const params = roleQuerySchema.parse(request.query);
  const role = await requireRole(params.roleId);
  const allInstitutions = (await query<Institution>("select * from institutions order by name")).rows;
  const allProjects = (await query<Project>("select * from projects order by due_date asc")).rows;
  const allApprovals = (
    await query<Record<string, unknown>>(
      "select * from approvals where approved_at is null order by priority desc, id",
    )
  ).rows;

  const scopedInstitutions = scopeInstitutions(role, allInstitutions);
  const scopedProjects = scopeProjects(role, allProjects);
  const scopedApprovals = scopeApprovals(role, allApprovals);

  return {
    role,
    metrics: dashboardMetrics(scopedInstitutions, scopedProjects, scopedApprovals),
    milestones: [
      { label: "Onboard", done: 74, status: "Healthy" },
      { label: "Curriculum", done: 68, status: "Watch" },
      { label: "Projects", done: 59, status: "Healthy" },
      { label: "Mentor review", done: 43, status: "Watch" },
      { label: "Showcase", done: 21, status: "Upcoming" },
    ],
    nextActions: scopedProjects.slice(0, 4),
    approvals: scopedApprovals.slice(0, 4),
  };
});

app.get("/api/institutions", async (request) => {
  const params = roleQuerySchema.parse(request.query);
  const role = await requireRole(params.roleId);
  const result = await query<Institution>("select * from institutions order by region, name");
  const scoped = scopeInstitutions(role, result.rows);
  return {
    institutions: searchRows(scoped, params.search, [
      "name",
      "region",
      "owner",
      "report_status",
      "risk",
    ]),
  };
});

app.get("/api/projects", async (request) => {
  const params = roleQuerySchema.parse(request.query);
  const role = await requireRole(params.roleId);
  const result = await query<Project>("select * from projects order by due_date asc");
  const scoped = scopeProjects(role, result.rows);
  return {
    projects: searchRows(scoped, params.search, [
      "title",
      "school",
      "incubator",
      "mentor",
      "stage",
      "status",
      "risk",
    ]),
  };
});

app.get("/api/governance", async (request) => {
  const params = roleQuerySchema.parse(request.query);
  const role = await requireRole(params.roleId);
  const result = await query<Record<string, unknown>>(
    "select * from approvals where approved_at is null order by priority desc, id",
  );
  const scoped = scopeApprovals(role, result.rows);
  return {
    approvals: searchRows(scoped, params.search, ["title", "module", "owner", "status", "priority"]),
  };
});

app.post("/api/governance/:approvalId/approve", async (request, reply) => {
  const params = z.object({ approvalId: z.string().min(1) }).parse(request.params);
  const body = loginSchema.parse(request.body);
  const role = await requireRole(body.roleId);

  if (!containsPermission(role, "approve")) {
    return reply.status(403).send({ message: "This role cannot approve workflow items." });
  }

  const result = await query<{ title: string }>(
    "update approvals set approved_at = now() where id = $1 and approved_at is null returning title",
    [params.approvalId],
  );

  if (!result.rows[0]) {
    return reply.status(404).send({ message: "Approval item not found or already approved." });
  }

  await writeAudit(role, `approved ${result.rows[0].title}`, "Governance");
  return { ok: true };
});

app.get("/api/resources", async (request) => {
  const params = roleQuerySchema.parse(request.query);
  const role = await requireRole(params.roleId);
  const result = await query<Record<string, unknown>>("select * from resources order by updated_at desc");
  const scoped = scopeResources(role, result.rows);
  return {
    resources: searchRows(scoped, params.search, ["title", "type", "audience", "owner", "access"]),
  };
});

app.get("/api/reports", async (request) => {
  const params = roleQuerySchema.parse(request.query);
  await requireRole(params.roleId);
  const result = await query<Record<string, unknown>>("select * from reports order by name");
  return {
    reports: searchRows(result.rows, params.search, ["name", "cadence", "owner", "status"]),
  };
});

app.post("/api/reports/run", async (request, reply) => {
  const body = reportRunSchema.parse(request.body);
  const role = await requireRole(body.roleId);

  if (!containsPermission(role, "reports")) {
    return reply.status(403).send({ message: "This role cannot generate reports." });
  }

  const reportId = body.reportId || "rep-401";
  const result = await query<{ name: string }>(
    "update reports set generated_count = generated_count + 1 where id = $1 returning name",
    [reportId],
  );

  if (!result.rows[0]) {
    return reply.status(404).send({ message: "Report not found." });
  }

  await writeAudit(role, `generated ${result.rows[0].name}`, "Reports");
  return { ok: true };
});

app.get("/api/audit", async (request) => {
  const params = roleQuerySchema.parse(request.query);
  const role = await requireRole(params.roleId);

  if (!containsPermission(role, "audit")) {
    const ownEvents = await query<Record<string, unknown>>(
      "select * from audit_events where role = $1 order by created_at desc limit 10",
      [role.label],
    );
    return { events: ownEvents.rows };
  }

  const result = await query<Record<string, unknown>>(
    "select * from audit_events order by created_at desc limit 20",
  );
  return { events: result.rows };
});

async function start() {
  await waitForDatabase();
  await createSchema();
  await app.listen({ host: "0.0.0.0", port: config.port });
}

start().catch(async (error) => {
  app.log.error(error);
  await pool.end();
  process.exit(1);
});
