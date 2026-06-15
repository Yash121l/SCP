# Central Programme Management Portal

A clean prototype scaffold for a secure, role-based programme management portal.

The old implementation has been preserved in Git history and pushed to GitHub. This version starts from the PRD and the new design direction: compact Codex-style UI, proper auth/RBAC boundaries, backend-owned authorization, and a PostgreSQL data layer.

## Stack

- Web: Vite, React, TypeScript, shared UI primitives
- Server: Fastify, TypeScript, httpOnly JWT sessions, Drizzle ORM, PostgreSQL
- Shared contracts: role/permission model and DTOs
- Tooling: pnpm workspaces, Turbo, Cloudflare Pages config for the web bundle

## Local Setup

```bash
cp .env.example .env
pnpm install
docker-compose up -d postgres
pnpm db:migrate
pnpm db:seed
pnpm dev
```

This machine has `docker-compose`, so the project scripts use:

```bash
pnpm compose:up
```

Open:

- Web app: http://localhost:5173
- Server health: http://localhost:4000/health

Demo login:

- Email: `pmu.admin@scp.local`
- Password: `Demo@12345`

## Cloudflare Pages

The web app is configured for Cloudflare Pages via `apps/web/wrangler.jsonc`.

```bash
pnpm build --filter @scp/web
npx wrangler pages deploy apps/web/dist --project-name scp-programme-portal
```

Deployment currently requires a valid Cloudflare session or `CLOUDFLARE_ACCOUNT_ID` plus an API token with Pages permissions.
