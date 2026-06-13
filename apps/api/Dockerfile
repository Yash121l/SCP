FROM node:22-alpine

WORKDIR /app

COPY package.json package-lock.json turbo.json tsconfig.base.json ./
COPY apps/api/package.json apps/api/package.json
COPY packages/ui/package.json packages/ui/package.json
COPY apps/web/package.json apps/web/package.json
RUN npm ci --workspace @scp/api --include-workspace-root

COPY apps/api apps/api
COPY packages packages

EXPOSE 4000

CMD ["npm", "run", "docker:dev", "--workspace", "@scp/api"]
