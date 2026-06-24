# Development

This repository is a **Bun monorepo** managed with workspaces:

```
apps/
  storeagent/ — Hono HTTP API (Bun + TypeScript + RxJS)
  frontend/   — SvelteKit web UI
```

## Install dependencies

```sh
bun install
```

## Start dev servers

```sh
# Backend — start dev server with hot reload and debug logging
bun run --filter storeagent dev

# Frontend — start Vite dev server
bun run --filter frontend dev
```

## Tests and checks

```sh
# Run storeagent tests
bun run --filter storeagent test

# Type check storeagent
bun run --filter storeagent tsc --noEmit

# Type check frontend
bun run --filter frontend check

# Lint and format entire repo
bunx biome check --write .
```
