# onionfs

A lightweight distributed file system for home LAN, designed to run on k3s clusters.

Each node runs a lightweight agent server that exposes a local HTTP API and coordinates with other nodes via NATS JetStream. The system is optimized for low-resource environments — ideal for Raspberry Pi homelab setups or small k3s deployments.

## Apps

```
apps/
  storeagent/ — Hono HTTP API (Bun + TypeScript + RxJS)
  frontend/   — SvelteKit web UI (Svelte 5 runes)
```

## Current features

- **Storeagent**: serve files with byte-range support, streamed uploads, multipart uploads, NATS heartbeats, and path-traversal-safe mount access.
- **Frontend**: live node dashboard, mount browser with list/grid views, breadcrumbs, file preview for images/videos, and download fallback for other files.
- **Shared package**: reversible base64url path ids, NATS subjects/streams, and `AnnounceMessage` types.

## Documentation

See the [docs/](docs/) folder and [plan.md](plan.md) for the full roadmap.

## Quick start

```sh
# Install dependencies
bun install

# Run tests
bun test

# Start the frontend dev server
cd apps/frontend && bun run dev

# Start the storeagent (requires a config file)
cd apps/storeagent && bun run start
```
