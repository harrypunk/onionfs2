# ── Stage 1: Builder ──────────────────────────────────────────────
ARG BUN_VERSION=1.3.13
FROM oven/bun:${BUN_VERSION}-alpine AS builder

WORKDIR /app

# Copy workspace files for dependency resolution
COPY package.json bun.lock ./
COPY apps/frontend/package.json ./apps/frontend/
COPY apps/storeagent/package.json ./apps/storeagent/
COPY packages/shared/package.json ./packages/shared/

# Install dependencies
RUN bun install --registry=https://registry.npmmirror.com --frozen-lockfile


# Copy source
COPY apps/storeagent/src ./apps/storeagent/src
COPY apps/storeagent/tsconfig.json ./apps/storeagent/
COPY packages/shared ./packages/shared

# Build the server bundle
WORKDIR /app/apps/storeagent
RUN bun build src/index.ts --target=bun --outfile=dist/index.js

# ── Stage 2: Runtime ──────────────────────────────────────────────
FROM oven/bun:${BUN_VERSION}-alpine AS runtime

WORKDIR /app

# Create non-root user
RUN addgroup -g 1001 -S storeagent && adduser -S storeagent -u 1001 -G storeagent

# Copy workspace manifests and install production deps
COPY --chown=storeagent:storeagent package.json bun.lock ./
COPY --chown=storeagent:storeagent apps/frontend/package.json ./apps/frontend/
COPY --chown=storeagent:storeagent apps/storeagent/package.json ./apps/storeagent/
COPY --chown=storeagent:storeagent packages/shared/package.json ./packages/shared/
RUN bun install --registry=https://registry.npmmirror.com --frozen-lockfile --production

# Copy source
COPY --chown=storeagent:storeagent apps/storeagent/src ./apps/storeagent/src
COPY --chown=storeagent:storeagent apps/storeagent/tsconfig.json ./apps/storeagent/
COPY --chown=storeagent:storeagent packages/shared ./packages/shared

USER storeagent

WORKDIR /app/apps/storeagent

ENV NODE_ENV=production

EXPOSE 3000
CMD ["bun", "run", "src/index.ts"]
