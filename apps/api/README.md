# SCP API Vercel Deployment

This package exists because the Vercel `scp-api` project is configured with root directory `apps/api`.

It does not duplicate backend logic. `index.ts` adapts Vercel serverless requests to the Fastify app exported by `apps/server/src/server.ts`.

Required Vercel environment variables:

- `DATABASE_URL`
- `JWT_SECRET`
- `COOKIE_SECRET`
- `FRONTEND_ORIGIN`
- `NODE_ENV=production`
