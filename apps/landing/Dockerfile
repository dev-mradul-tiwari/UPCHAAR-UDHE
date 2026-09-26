# syntax=docker/dockerfile:1
# Build context is the REPO ROOT (see docker-compose.yml).

FROM node:22-alpine AS base
RUN corepack enable
# pnpm's deps-status check wants an interactive confirmation with no TTY
# available in a Docker build; CI=true makes it skip that prompt.
ENV CI=true
ENV COREPACK_ENABLE_DOWNLOAD_PROMPT=0
WORKDIR /app

# ---------------------------------------------------------------- deps
FROM base AS deps
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml turbo.json ./
# Include other packages if they exist (landing might not need them, but it doesn't hurt for turbo)
COPY packages/typescript-config/package.json ./packages/typescript-config/
COPY apps/landing/package.json              ./apps/landing/
RUN --mount=type=cache,id=pnpm,target=/pnpm/store \
    pnpm config set store-dir /pnpm/store && \
    pnpm install --frozen-lockfile --filter @upchaar/landing...

# --------------------------------------------------------------- build
FROM base AS build
ENV NEXT_TELEMETRY_DISABLED=1

COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/apps/landing/node_modules   ./apps/landing/node_modules
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml turbo.json ./
COPY packages ./packages
COPY apps/landing ./apps/landing

# Build landing app
RUN pnpm --filter @upchaar/landing run build

# ------------------------------------------------------------- runtime
FROM base AS runner
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
RUN addgroup -g 1001 -S nodejs && adduser -S nextjs -u 1001

COPY --from=build --chown=nextjs:nodejs /app/apps/landing/public ./apps/landing/public
COPY --from=build --chown=nextjs:nodejs /app/apps/landing/.next/standalone ./
COPY --from=build --chown=nextjs:nodejs /app/apps/landing/.next/static ./apps/landing/.next/static

USER nextjs
WORKDIR /app/apps/landing
ENV PORT=3004
ENV HOSTNAME=0.0.0.0
EXPOSE 3004

HEALTHCHECK --interval=15s --timeout=5s --start-period=15s --retries=5 \
  CMD node -e "fetch('http://localhost:3004').then(r=>process.exit(r.status<500?0:1)).catch(()=>process.exit(1))"

CMD ["node", "server.js"]
