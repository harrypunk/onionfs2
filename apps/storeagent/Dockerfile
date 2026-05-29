# ── Stage 1: Builder ──────────────────────────────────────────────
FROM oven/bun:alpine AS builder

WORKDIR /app

# Copy workspace files for dependency resolution
COPY package.json bun.lock ./
COPY apps/storeagent/package.json ./apps/storeagent/

# Install dependencies
RUN bun install --frozen-lockfile

# Copy source
COPY apps/storeagent/src ./apps/storeagent/src
COPY apps/storeagent/tsconfig.json ./apps/storeagent/

# Build the server bundle
WORKDIR /app/apps/storeagent
RUN bun build src/index.ts --target=bun --outfile=dist/index.js

# ── Stage 2: Runtime ──────────────────────────────────────────────
FROM oven/bun:alpine AS runtime

WORKDIR /app

# Create non-root user
RUN addgroup -g 1001 -S storeagent && adduser -S storeagent -u 1001 -G storeagent

# Copy only the built bundle
COPY --from=builder --chown=storeagent:storeagent /app/apps/storeagent/dist/index.js ./

USER storeagent

EXPOSE 3000
CMD ["bun", "run", "index.js"]
