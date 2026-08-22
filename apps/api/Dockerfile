# syntax=docker/dockerfile:1
# Build context is the REPO ROOT (see docker-compose.yml).

FROM node:22-alpine AS base
RUN corepack enable
# pnpm's deps-status check wants an interactive confirmation with no TTY
# available in a Docker build; CI=true makes it skip that prompt.
ENV CI=true
WORKDIR /app

# ---------------------------------------------------------------- deps
FROM base AS deps
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml turbo.json ./
COPY packages/typescript-config/package.json ./packages/typescript-config/
COPY packages/types/package.json            ./packages/types/
COPY packages/db/package.json               ./packages/db/
COPY apps/api/package.json                  ./apps/api/
RUN --mount=type=cache,id=pnpm,target=/pnpm/store \
    pnpm config set store-dir /pnpm/store && \
    pnpm install --frozen-lockfile --filter @upchaar/api...

# --------------------------------------------------------------- build
FROM base AS build
COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/packages/types/node_modules ./packages/types/node_modules
COPY --from=deps /app/packages/db/node_modules    ./packages/db/node_modules
COPY --from=deps /app/apps/api/node_modules       ./apps/api/node_modules
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml turbo.json ./
COPY packages ./packages
COPY apps/api ./apps/api

# Prisma client must be generated before the API is type-compiled.
RUN pnpm --filter @upchaar/db run build \
 && pnpm --filter @upchaar/types run build \
 && pnpm --filter @upchaar/api run build

# ------------------------------------------------------------- runtime
# Deliberately NOT running `pnpm prune --prod` here: pnpm materialises
# packages from its content-addressable store, and pruning re-links
# @prisma/client from that pristine store — silently discarding the
# generated client `prisma generate` just wrote in place and reverting it to
# the "did not initialize yet" stub. Copying straight from `build` (same
# stage `migrate` uses) keeps the real generated client intact. The image is
# a little larger with devDependencies included; correctness over size for
# this deliverable.
FROM base AS runner
ENV NODE_ENV=production
RUN addgroup -g 1001 -S nodejs && adduser -S api -u 1001

COPY --from=build --chown=api:nodejs /app/node_modules ./node_modules
COPY --from=build --chown=api:nodejs /app/package.json ./package.json
COPY --from=build --chown=api:nodejs /app/packages ./packages
COPY --from=build --chown=api:nodejs /app/apps/api/dist         ./apps/api/dist
COPY --from=build --chown=api:nodejs /app/apps/api/package.json ./apps/api/package.json
COPY --from=build --chown=api:nodejs /app/apps/api/node_modules ./apps/api/node_modules

USER api
WORKDIR /app/apps/api
EXPOSE 4000

HEALTHCHECK --interval=15s --timeout=5s --start-period=20s --retries=5 \
  CMD node -e "fetch('http://localhost:'+(process.env.PORT||4000)+'/health').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"

CMD ["node", "dist/index.js"]
