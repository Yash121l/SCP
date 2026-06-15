# Source of Living Decisions

This file tracks decisions that shape the portal so future agents do not re-litigate the same ground.

## 2026-06-13

- Preserve the original implementation as the first Git commit and remote snapshot before rewriting.
- Rebuild from the PRD instead of refactoring the old code.
- Use a compact operational UI inspired by Codex/T3Code: persistent sidebar, dense status surfaces, restrained tokens, strong table/list affordances.
- Use RTP Screener as a backend/security reference: protected routes, auth context on the client, server-owned authorization, audit-focused records.
- Use a monorepo with `apps/web`, `apps/server`, `packages/contracts`, `packages/database`, and `packages/ui`.
- Use `apps/server` for the backend runtime to mirror the app/package separation in `pingdotgg/t3code`.
- Use `packages/database` for Drizzle ORM schema, database client creation, migrations, and seed data.
- Server modules must follow route/service/repository boundaries, with route files under `apps/server/src/modules/*/*.routes.ts`.
- Frontend routes must live under `apps/web/src/app/routes`, with feature UI split under `apps/web/src/features/*/components`.
- Backend-owned RBAC and scoped access are mandatory. The frontend may hide actions, but it must never be the authority.
- Every mutating operation must write an audit log.
- PostgreSQL is the prototype database because the PRD requires structured master data, audit logs, governance workflow state, and reporting.
- Cloudflare Pages is the intended static web host. Server/API hosting remains environment-specific until Cloudflare credentials and database deployment choices are confirmed.

## Open Decisions

- Final production auth provider: custom JWT, Clerk, Auth.js, or enterprise SSO.
- Production data platform: managed Postgres, Cloudflare D1, or another government-approved store.
- Which modules require maker-checker approval in MVP.
- Which leadership dashboards must hide student-level data and show aggregate-only views.
- Whether one person can hold multiple concurrent roles across organizations.
