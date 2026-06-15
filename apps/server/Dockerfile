FROM node:22-alpine AS deps
WORKDIR /app
RUN corepack enable
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml turbo.json tsconfig.base.json ./
COPY apps/server/package.json apps/server/package.json
COPY packages/contracts/package.json packages/contracts/package.json
COPY packages/database/package.json packages/database/package.json
RUN pnpm install --frozen-lockfile

FROM deps AS build
COPY apps/server apps/server
COPY packages/contracts packages/contracts
COPY packages/database packages/database
RUN pnpm --filter @scp/server build

FROM node:22-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
RUN corepack enable
COPY --from=build /app/package.json /app/pnpm-lock.yaml /app/pnpm-workspace.yaml ./
COPY --from=build /app/apps/server/package.json apps/server/package.json
COPY --from=build /app/apps/server/dist apps/server/dist
COPY --from=build /app/packages/contracts/package.json packages/contracts/package.json
COPY --from=build /app/packages/contracts/dist packages/contracts/dist
COPY --from=build /app/packages/database/package.json packages/database/package.json
COPY --from=build /app/packages/database/dist packages/database/dist
COPY --from=build /app/packages/database/migrations packages/database/migrations
RUN pnpm install --prod --frozen-lockfile
EXPOSE 4000
CMD ["node", "apps/server/dist/main.js"]

