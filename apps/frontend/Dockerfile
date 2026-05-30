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
COPY apps/frontend ./apps/frontend
COPY packages/shared ./packages/shared

# Build
WORKDIR /app/apps/frontend
RUN bun run build

# ── Stage 2: Runtime ──────────────────────────────────────────────
FROM oven/bun:${BUN_VERSION}-alpine AS runtime

WORKDIR /app

# Create non-root user
RUN addgroup -g 1001 -S frontend && adduser -S frontend -u 1001 -G frontend

# Copy built app
COPY --from=builder --chown=frontend:frontend /app/apps/frontend/build ./

USER frontend

EXPOSE 3000
CMD ["bun", "run", "index.js"]
