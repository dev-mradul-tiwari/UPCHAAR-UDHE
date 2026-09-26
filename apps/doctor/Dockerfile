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
COPY packages/typescript-config/package.json ./packages/typescript-config/
COPY packages/types/package.json            ./packages/types/
COPY packages/ui/package.json               ./packages/ui/
COPY apps/doctor/package.json              ./apps/doctor/
RUN --mount=type=cache,id=pnpm,target=/pnpm/store \
    pnpm config set store-dir /pnpm/store && \
    pnpm install --frozen-lockfile --filter @upchaar/doctor...

# --------------------------------------------------------------- build
FROM base AS build
ARG NEXT_PUBLIC_API_URL=http://localhost:4000/api/v1
ENV NEXT_PUBLIC_API_URL=${NEXT_PUBLIC_API_URL}
ENV NEXT_TELEMETRY_DISABLED=1

COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/packages/types/node_modules ./packages/types/node_modules
COPY --from=deps /app/packages/ui/node_modules    ./packages/ui/node_modules
COPY --from=deps /app/apps/doctor/node_modules   ./apps/doctor/node_modules
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml turbo.json ./
COPY packages ./packages
COPY apps/doctor ./apps/doctor

# The shared type-contract package must be built before Next type-checks
# the app; @upchaar/ui is transpiled straight from source, no build needed.
RUN pnpm --filter @upchaar/types run build \
 && pnpm --filter @upchaar/doctor run build

# ------------------------------------------------------------- runtime
FROM base AS runner
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
RUN addgroup -g 1001 -S nodejs && adduser -S nextjs -u 1001

COPY --from=build --chown=nextjs:nodejs /app/apps/doctor/public ./apps/doctor/public
COPY --from=build --chown=nextjs:nodejs /app/apps/doctor/.next/standalone ./
COPY --from=build --chown=nextjs:nodejs /app/apps/doctor/.next/static ./apps/doctor/.next/static

USER nextjs
WORKDIR /app/apps/doctor
ENV PORT=3001
ENV HOSTNAME=0.0.0.0
EXPOSE 3001

HEALTHCHECK --interval=15s --timeout=5s --start-period=15s --retries=5 \
  CMD node -e "fetch('http://localhost:3001').then(r=>process.exit(r.status<500?0:1)).catch(()=>process.exit(1))"

CMD ["node", "server.js"]
