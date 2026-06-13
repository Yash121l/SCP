# Central Programme Management Portal MVP

Working MVP for the PRD in `docs/index.html`.

## One-command demo

```bash
npm install
npm run compose:up
```

Open:

- Web app: http://127.0.0.1:5173
- API health: http://127.0.0.1:4000/health

Docker Compose starts Postgres, seeds demo data through the API service, and serves the React app. The npm script automatically uses either `docker compose` or `docker-compose`, depending on what is available.

## Local development

```bash
npm install
cp .env.example .env
npm run dev
```

For local API development, provide `DATABASE_URL` and run:

```bash
npm run seed
```
