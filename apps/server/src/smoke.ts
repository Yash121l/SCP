import { createDatabase, institutions, studentProjects, students } from "@scp/database";
import { eq, like, sql } from "drizzle-orm";
import { buildServer } from "./server.js";

const connectionString = process.env.DATABASE_URL ?? "postgres://scp:scp@localhost:5432/scp_portal";

function parseJson(payload: string) {
  return JSON.parse(payload) as Record<string, unknown>;
}

function assertStatus(label: string, actual: number, expected: number) {
  if (actual !== expected) {
    throw new Error(`${label} expected ${expected}, received ${actual}`);
  }
}

async function cleanupSmokeData() {
  const { db, pool } = createDatabase(connectionString);

  try {
    const projectsToDelete = await db
      .select({
        institutionId: studentProjects.institutionId,
        studentId: studentProjects.studentId,
      })
      .from(studentProjects)
      .where(like(studentProjects.title, "Smoke Test Project%"));
    const institutionDecrements = new Map<string, number>();
    const studentDecrements = new Map<string, number>();

    for (const project of projectsToDelete) {
      institutionDecrements.set(
        project.institutionId,
        (institutionDecrements.get(project.institutionId) ?? 0) + 1,
      );

      if (project.studentId) {
        studentDecrements.set(project.studentId, (studentDecrements.get(project.studentId) ?? 0) + 1);
      }
    }

    await db.execute(sql`
      DELETE FROM audit_logs
      WHERE entity_type = 'project'
        AND entity_id IN (
          SELECT id::text FROM student_projects WHERE title LIKE 'Smoke Test Project%'
        )
    `);
    await db.execute(sql`
      DELETE FROM audit_logs
      WHERE entity_type = 'approval'
        AND entity_id IN (
          SELECT id::text FROM approvals WHERE title LIKE 'Review project: Smoke Test Project%'
        )
    `);
    await db.execute(sql`
      DELETE FROM audit_logs
      WHERE entity_type = 'institution'
        AND action = 'Created school'
        AND metadata->>'name' LIKE 'Smoke Test School%'
    `);
    await db.execute(sql`DELETE FROM student_projects WHERE title LIKE 'Smoke Test Project%'`);
    await db.execute(sql`DELETE FROM approvals WHERE title LIKE 'Review project: Smoke Test Project%'`);
    await db.execute(sql`DELETE FROM institutions WHERE name LIKE 'Smoke Test School%'`);

    for (const [institutionId, decrement] of institutionDecrements) {
      await db
        .update(institutions)
        .set({
          projectCount: sql`GREATEST(0, ${institutions.projectCount} - ${decrement})`,
          updatedAt: new Date(),
        })
        .where(eq(institutions.id, institutionId));
    }

    for (const [studentId, decrement] of studentDecrements) {
      await db
        .update(students)
        .set({
          projectCount: sql`GREATEST(0, ${students.projectCount} - ${decrement})`,
          updatedAt: new Date(),
        })
        .where(eq(students.id, studentId));
    }
  } finally {
    await pool.end();
  }
}

await cleanupSmokeData();
const { app } = await buildServer();

try {
  const health = await app.inject({ method: "GET", url: "/health" });
  assertStatus("health", health.statusCode, 200);

  const unauthenticatedDashboard = await app.inject({ method: "GET", url: "/api/dashboard" });
  assertStatus("unauthenticated dashboard", unauthenticatedDashboard.statusCode, 401);

  const login = await app.inject({
    method: "POST",
    payload: { email: "gov.main@scp.local", password: "Demo@12345" },
    url: "/api/auth/login",
  });
  assertStatus("government main login", login.statusCode, 200);

  const cookie = String(login.headers["set-cookie"]);
  const dashboard = await app.inject({
    headers: { cookie },
    method: "GET",
    url: "/api/dashboard",
  });
  assertStatus("dashboard", dashboard.statusCode, 200);
  const dashboardPayload = parseJson(dashboard.payload);
  const firstHub = (dashboardPayload.hubs as Array<{ id: string }>)[0];
  const firstInstitution = (dashboardPayload.institutions as Array<{ id: string }>)[0];
  const firstStudent = (dashboardPayload.students as Array<{ id: string }>)[0];

  if (!firstHub) {
    throw new Error("dashboard did not return an incubator for smoke setup");
  }

  if (!firstInstitution || !firstStudent) {
    throw new Error("dashboard did not return a school and student for project smoke setup");
  }

  const created = await app.inject({
    headers: { cookie },
    method: "POST",
    payload: {
      address: "1 Smoke Learning Road",
      contactEmail: "smoke.school@scp.local",
      district: "Smoke District",
      hubId: firstHub.id,
      name: `Smoke Test School ${Date.now()}`,
      principalName: "Smoke Principal",
      projectCount: 3,
      region: "Smoke Zone",
      status: "onboarding",
      studentCount: 48,
      type: "school",
    },
    url: "/api/institutions",
  });
  assertStatus("create institution", created.statusCode, 201);

  const createProject = await app.inject({
    headers: { cookie },
    method: "POST",
    payload: {
      domain: "Smoke verification",
      institutionId: firstInstitution.id,
      problemStatement: "Smoke test needs a project request to exercise approval and audit flow.",
      solutionSummary: "Create a minimal project request and move it through a status update.",
      studentId: firstStudent.id,
      title: `Smoke Test Project ${Date.now()}`,
    },
    url: "/api/projects",
  });
  assertStatus("create project", createProject.statusCode, 201);

  const createdProject = parseJson(createProject.payload).project as { approvalId: string; id: string };
  if (!createdProject.approvalId) {
    throw new Error("project creation did not attach a steering approval");
  }

  const updateProjectStatus = await app.inject({
    headers: { cookie },
    method: "PATCH",
    payload: {
      reviewNote: "Smoke moved project into implementation.",
      status: "in_progress",
    },
    url: `/api/projects/${createdProject.id}/status`,
  });
  assertStatus("update project status", updateProjectStatus.statusCode, 200);

  const expertLogin = await app.inject({
    method: "POST",
    payload: { email: "expert@scp.local", password: "Demo@12345" },
    url: "/api/auth/login",
  });
  assertStatus("external expert login", expertLogin.statusCode, 200);

  const expertCookie = String(expertLogin.headers["set-cookie"]);
  const curriculum = await app.inject({
    headers: { cookie: expertCookie },
    method: "GET",
    url: "/api/curriculum",
  });
  assertStatus("expert curriculum access", curriculum.statusCode, 200);

  const expertProject = await app.inject({
    headers: { cookie: expertCookie },
    method: "GET",
    url: `/api/projects/${createdProject.id}`,
  });
  assertStatus("expert project access", expertProject.statusCode, 200);

  const expertFeedback = await app.inject({
    headers: { cookie: expertCookie },
    method: "POST",
    payload: {
      note: "Smoke expert review confirms project feedback workflow is available.",
      rating: 4,
    },
    url: `/api/projects/${createdProject.id}/feedback`,
  });
  assertStatus("expert feedback", expertFeedback.statusCode, 201);

  const expertStatusDenied = await app.inject({
    headers: { cookie: expertCookie },
    method: "PATCH",
    payload: {
      reviewNote: "Expert should not move status.",
      status: "completed",
    },
    url: `/api/projects/${createdProject.id}/status`,
  });
  assertStatus("expert project status denial", expertStatusDenied.statusCode, 403);

  const approvalsResponse = await app.inject({
    headers: { cookie },
    method: "GET",
    url: "/api/governance/approvals",
  });
  assertStatus("list approvals", approvalsResponse.statusCode, 200);

  const approvals = parseJson(approvalsResponse.payload).approvals as Array<{
    id: string;
    status: string;
  }>;
  const pending = approvals.find((approval) => approval.status === "pending");

  if (pending) {
    const decision = await app.inject({
      headers: { cookie },
      method: "PATCH",
      payload: {
        decisionNote: "Smoke verification approval.",
        status: "approved",
      },
      url: `/api/governance/approvals/${pending.id}/decision`,
    });
    assertStatus("approval decision", decision.statusCode, 200);
  }

  const audit = await app.inject({
    headers: { cookie },
    method: "GET",
    url: "/api/audit",
  });
  assertStatus("audit", audit.statusCode, 200);

  const schoolLogin = await app.inject({
    method: "POST",
    payload: { email: "school@scp.local", password: "Demo@12345" },
    url: "/api/auth/login",
  });
  assertStatus("school login", schoolLogin.statusCode, 200);

  const schoolCookie = String(schoolLogin.headers["set-cookie"]);
  const deniedInstitutionCreate = await app.inject({
    headers: { cookie: schoolCookie },
    method: "POST",
    payload: {
      address: "22 Denied Road",
      contactEmail: "denied.school@scp.local",
      district: "Denied District",
      hubId: firstHub.id,
      name: "Denied School",
      principalName: "Denied Principal",
      region: "Denied Zone",
      type: "school",
    },
    url: "/api/institutions",
  });
  assertStatus("school institution create denial", deniedInstitutionCreate.statusCode, 403);

  const deniedAudit = await app.inject({
    headers: { cookie: schoolCookie },
    method: "GET",
    url: "/api/audit",
  });
  assertStatus("school audit denial", deniedAudit.statusCode, 403);

  console.log(
    JSON.stringify(
      {
        audit: audit.statusCode,
        createInstitution: created.statusCode,
        createProject: createProject.statusCode,
        dashboard: dashboard.statusCode,
        expertCurriculum: curriculum.statusCode,
        expertFeedback: expertFeedback.statusCode,
        expertStatusDenied: expertStatusDenied.statusCode,
        health: health.statusCode,
        schoolAuditDenied: deniedAudit.statusCode,
        schoolCreateDenied: deniedInstitutionCreate.statusCode,
        updateProjectStatus: updateProjectStatus.statusCode,
      },
      null,
      2,
    ),
  );
} finally {
  await app.close();
  await cleanupSmokeData();
}
