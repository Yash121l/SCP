# Source of Living Decisions

This file is the project decision log for the Central Programme Management Portal. It records product, architecture, data, auth, deployment and design choices that future agents should treat as current unless a stakeholder changes them.

## 2026-06-13

- Use the PRD in `docs/central-programme-management-portal-prd.enhanced.md` as product truth.
- Keep this project as a monorepo with `apps/web`, `apps/server`, `packages/contracts`, `packages/database` and `packages/ui`.
- Keep backend modules under `apps/server/src/modules/*` with route/service/repository separation.
- Keep Drizzle schema, migrations and seed data in `packages/database`.
- Authentication and authorization are backend responsibilities. UI checks only hide or reveal convenience controls.
- Every protected API must validate a session and check a permission.
- Every mutating API must write an audit record before it is considered complete.
- The active role chain is limited to six programme roles: government main, steering committee, incubator, incubator employee, school and student.
- Government main and steering committee are global scopes. Incubator and incubator employee are incubator-scoped. School is school-scoped. Student is student-record scoped.
- Use SAKSHAM language in the product surface: incubators, schools, school champions, student projects, governance approvals and audit history.
- Use a compact operational UX inspired by FundOS/SignalOS: dense authenticated shell, dark neutral surfaces, grouped sidebar navigation, compact rows, clear status badges and no marketing landing page.
- Use the actual FundOS interaction patterns reviewed from its shell, portfolio table/detail and updates inbox components: slim title topbar, grouped compact sidebar, searchable dense index tables, record detail headers with metrics strips and route-level creation pages.
- Treat sidebar visibility as a role-specific sitemap first and a permission check second. Scoped users should not see global index tabs simply because they have scoped read permission.
- Keep master-data creation out of index pages. Add actions open `/workspace/*/new`, and successful creates navigate to the created detail page whenever the API returns a record ID.
- Preserve the existing `/api/hubs` and `/api/institutions` route paths for implementation stability, while user-facing labels say incubators and schools.
- PostgreSQL remains the prototype database target because the PRD requires structured master data, governance workflow state, audit logs and reporting.
- Cloudflare Pages is the intended static web host for `apps/web`. Server/API hosting remains environment-specific until production database and government deployment constraints are confirmed.

## 2026-06-14

- Treat student projects as first-class workflow records, not only count fields on schools or students.
- Project requests can be raised by scoped programme operators, schools and students through `/workspace/projects/new`, then opened as record detail pages with status, review notes, school, incubator and owner context.
- Creating a project writes a `project` audit record and automatically creates a steering-committee governance approval titled `Review project: ...`.
- Updating a project status writes a `project` audit record with the status and review note.
- The Projects sidebar item is part of the role-specific sitemap for all six active programme roles, scoped by backend organization access.
- Topbar search includes project records and routes matches to `/workspace/projects/:id`.
- Add external experts as the seventh active programme role for partner review workflows. External experts can read projects, institutions, curriculum progress and expert records, and can add project feedback, but cannot change project execution status.
- Add curriculum modules and initial curriculum progress surfaces as first-class data. As of 2026-06-15, the authoritative model is incubator-owned curriculum assignments with stage, learner and project mappings.
- Add external expert partner records and project feedback. Feedback is attached to student projects, appears in project detail and Experts views, and writes audit history when created.
- Login responses now return the signed session token as well as setting the session cookie, because the web client uses the token for API authorization headers. Development CORS allows both `localhost:5173` and `127.0.0.1:5173` for reliable local browser testing.

## 2026-06-15

- Curriculum delivery is incubator-owned, not school-owned. New curriculum assignments map modules to incubators, owners, delivery stages, students and linked student projects; school/student scopes only filter the learner mappings they can see.
- Incubators, schools and dashboard geography now store latitude, longitude, geography notes and performance scores so analytical map views are based on real coordinate data rather than decorative region cards.
- Operational resources expose audited update/delete flows: incubators and schools are archived for delete actions, while employees, students and projects can be removed through scoped backend routes. All mutating routes still require session authentication, permission checks and audit writes.
- Detail pages should use real tab state inspired by FundOS route/query tabs rather than anchor-scroll sections. The current implementation uses shared `RecordTabs` for incubator, school, project, student and curriculum detail surfaces.
- Incubator and incubator employee roles have curriculum read/manage permission because incubator employees run programme curriculum in schools.
- Index row edit actions use FundOS-style right-side drawers instead of browser prompts. Incubators, schools, employees, students and projects can update relationship fields, operational status and relevant metrics through API-backed forms.
- Dashboard geography uses OpenStreetMap tile imagery with markers projected from stored school coordinates. The map panel must stay data-backed and should not regress to decorative shapes or fake zones.
- `/workspace/updates` is the programme operating inbox. It consolidates student feedback, student progress, student updates, upgrade reports, incubation updates and incubation-centre health from existing scoped data so analytical and operational users have a single review flow.
- Role ownership is workflow-specific: steering committee creates incubators and assigns incubator employees; incubators create schools; schools create students; project/curriculum work remains scoped by role. Dashboards should render role-specific workspaces instead of one shared page with disabled or missing controls.
- Steering committee has `hubs:manage` and `people:manage`; incubators keep `institutions:manage`; schools keep `students:manage`. These permissions are enforced in backend RBAC and mirrored in navigation/actions.
- Record detail pages must expose the same permission-aware update/archive/delete controls as their index rows, using the shared compact edit drawer. Edit drawers should keep fields top-aligned, fixed-height where appropriate and validation-bounded for geography, scores and count metrics.

## Open Decisions

- Final production auth provider: custom JWT, Auth.js, Clerk or enterprise SSO.
- Production data platform: managed Postgres, Cloudflare D1 or another approved store.
- Which governance workflows require maker-checker approval in MVP.
- Which dashboards must show aggregate-only student data for leadership roles.
- Whether one person can hold multiple active roles across organizations.
