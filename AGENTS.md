# AGENTS.md

## Project Mission

Build the Central Programme Management Portal as a secure operating layer for programme data, governance workflows, scoped institutional access, monitoring, reporting, document control, and audit history.

The PRD in `docs/central-programme-management-portal-prd.enhanced.md` is the source of product truth. `SOLD.md` is the source of current implementation decisions.

## Reference Direction

- `pingdotgg/t3code`: compact Codex-style app shell, disciplined agent instructions, monorepo separation, resilient UI surfaces.
- `devxsubh/rtp-screener`: protected product routes, auth context patterns, compliance-grade backend boundaries, audit-focused workflows.

Use the design concepts, not copy-pasted code. The portal should feel like a dense operational tool: quiet chrome, compact controls, strong hierarchy, role-aware data, and no marketing-style landing page.

## Architecture

- `apps/web`: Vite React portal UI. Owns auth UX, role-scoped dashboard, module navigation, and API client code.
- `apps/web/src/app/routes`: Browser route definitions and route-level components.
- `apps/web/src/features`: Product feature modules; each feature owns its local components.
- `apps/web/src/components`: Shared app-level components such as navigation, brand, and reusable status surfaces.
- `apps/server`: Fastify API. Owns authentication, authorization, service modules, audit logging, and scoped data endpoints.
- `packages/contracts`: Shared roles, permissions, DTOs, and RBAC helpers. Keep this package framework-free.
- `packages/database`: Drizzle ORM schema, migration runner, seed data, and database client factory.
- `packages/ui`: Shared React UI primitives. Keep components small, accessible, and domain-neutral.
- `docs`: Product, design, architecture, and deployment notes.

## Non-Negotiables

- Authentication and authorization are backend responsibilities. UI checks are convenience only.
- Every protected API must validate a session and check a permission.
- Every mutating API must write an audit log before the task is considered done.
- Sensitive student-level data must stay scoped by role and organization.
- Reports and exports must be treated as controlled actions.
- Keep UI dense and operational. Avoid hero sections, oversized decorative cards, nested cards, and single-hue palettes.

## Commands

```bash
pnpm install
pnpm dev
pnpm typecheck
pnpm build
pnpm db:migrate
pnpm db:seed
pnpm smoke
pnpm compose:up
```

## Completion Bar

Before handing off a code change:

1. Run `pnpm typecheck`.
2. Run `pnpm build`.
3. For API/database changes, run or update migrations and seed data.
4. Check the app at desktop and mobile widths when touching UI.
5. Update `SOLD.md` when a material architecture, data, auth, deployment, or design decision changes.


# agent.md

Use `AGENTS.md` as the canonical agent instruction file for this project.

Important local expectations:

- Follow the PRD in `docs/central-programme-management-portal-prd.enhanced.md`.
- Follow architecture decisions in `SOLD.md`.
- Keep backend code in `apps/server/src/modules/*` with route/service/repository separation.
- Keep Drizzle ORM schema and migrations in `packages/database`.
- Run `pnpm typecheck` and `pnpm build` before handoff.
