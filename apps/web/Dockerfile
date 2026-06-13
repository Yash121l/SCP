FROM node:22-alpine

WORKDIR /app

COPY package.json package-lock.json turbo.json tsconfig.base.json ./
COPY apps/web/package.json apps/web/package.json
COPY apps/api/package.json apps/api/package.json
COPY packages/ui/package.json packages/ui/package.json
RUN npm ci --workspace @scp/web --include-workspace-root

COPY apps/web apps/web
COPY packages packages

EXPOSE 5173

CMD ["npm", "run", "dev", "--workspace", "@scp/web"]
