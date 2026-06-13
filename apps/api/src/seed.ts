import { pool, query, waitForDatabase } from "./db.js";
import { createSchema } from "./schema.js";
import {
  approvals,
  auditEvents,
  institutions,
  projects,
  reports,
  resources,
  roles,
} from "./seed-data.js";

export async function seedDatabase() {
  await waitForDatabase();
  await createSchema();

  for (const role of roles) {
    await query(
      `
      insert into roles (id, label, short_label, name, organization, scope, accent, permissions)
      values ($1, $2, $3, $4, $5, $6, $7, $8)
      on conflict (id) do update set
        label = excluded.label,
        short_label = excluded.short_label,
        name = excluded.name,
        organization = excluded.organization,
        scope = excluded.scope,
        accent = excluded.accent,
        permissions = excluded.permissions
      `,
      [
        role.id,
        role.label,
        role.short_label,
        role.name,
        role.organization,
        role.scope,
        role.accent,
        role.permissions,
      ],
    );
  }

  for (const institution of institutions) {
    await query(
      `
      insert into institutions
        (id, type, name, region, owner, schools, students, teachers, projects, health, report_status, risk)
      values ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
      on conflict (id) do update set
        type = excluded.type,
        name = excluded.name,
        region = excluded.region,
        owner = excluded.owner,
        schools = excluded.schools,
        students = excluded.students,
        teachers = excluded.teachers,
        projects = excluded.projects,
        health = excluded.health,
        report_status = excluded.report_status,
        risk = excluded.risk
      `,
      [
        institution.id,
        institution.type,
        institution.name,
        institution.region,
        institution.owner,
        institution.schools,
        institution.students,
        institution.teachers,
        institution.projects,
        institution.health,
        institution.report_status,
        institution.risk,
      ],
    );
  }

  for (const project of projects) {
    await query(
      `
      insert into projects
        (id, title, school, incubator, owner, mentor, stage, score, status, risk, next_action, due_date)
      values ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
      on conflict (id) do update set
        title = excluded.title,
        school = excluded.school,
        incubator = excluded.incubator,
        owner = excluded.owner,
        mentor = excluded.mentor,
        stage = excluded.stage,
        score = excluded.score,
        status = excluded.status,
        risk = excluded.risk,
        next_action = excluded.next_action,
        due_date = excluded.due_date
      `,
      [
        project.id,
        project.title,
        project.school,
        project.incubator,
        project.owner,
        project.mentor,
        project.stage,
        project.score,
        project.status,
        project.risk,
        project.next_action,
        project.due_date,
      ],
    );
  }

  for (const approval of approvals) {
    await query(
      `
      insert into approvals
        (id, title, module, owner, requester_role, status, priority, age, approved_at)
      values ($1, $2, $3, $4, $5, $6, $7, $8, null)
      on conflict (id) do update set
        title = excluded.title,
        module = excluded.module,
        owner = excluded.owner,
        requester_role = excluded.requester_role,
        status = excluded.status,
        priority = excluded.priority,
        age = excluded.age,
        approved_at = null
      `,
      [
        approval.id,
        approval.title,
        approval.module,
        approval.owner,
        approval.requester_role,
        approval.status,
        approval.priority,
        approval.age,
      ],
    );
  }

  for (const resource of resources) {
    await query(
      `
      insert into resources
        (id, title, type, version, audience, owner, access, updated_at)
      values ($1, $2, $3, $4, $5, $6, $7, $8)
      on conflict (id) do update set
        title = excluded.title,
        type = excluded.type,
        version = excluded.version,
        audience = excluded.audience,
        owner = excluded.owner,
        access = excluded.access,
        updated_at = excluded.updated_at
      `,
      [
        resource.id,
        resource.title,
        resource.type,
        resource.version,
        resource.audience,
        resource.owner,
        resource.access,
        resource.updated_at,
      ],
    );
  }

  for (const report of reports) {
    await query(
      `
      insert into reports
        (id, name, cadence, owner, status, coverage, generated_count)
      values ($1, $2, $3, $4, $5, $6, 0)
      on conflict (id) do update set
        name = excluded.name,
        cadence = excluded.cadence,
        owner = excluded.owner,
        status = excluded.status,
        coverage = excluded.coverage,
        generated_count = reports.generated_count
      `,
      [
        report.id,
        report.name,
        report.cadence,
        report.owner,
        report.status,
        report.coverage,
      ],
    );
  }

  await query("truncate table audit_events restart identity");

  for (const event of auditEvents) {
    await query(
      `
      insert into audit_events (actor, role, event, module, created_at)
      values ($1, $2, $3, $4, now() - interval '1 hour')
      `,
      [event.actor, event.role, event.event, event.module],
    );
  }
}

seedDatabase()
  .then(async () => {
    await pool.end();
  })
  .catch(async (error) => {
    process.stderr.write(`Seed failed: ${error instanceof Error ? error.message : String(error)}\n`);
    await pool.end();
    process.exit(1);
  });
