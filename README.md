# onionfs

A lightweight distributed file system for home LAN, designed to run on k3s clusters.

Each node runs a lightweight agent server that exposes a local HTTP API and coordinates with other nodes via NATS JetStream. The system is optimized for low-resource environments — ideal for Raspberry Pi homelab setups or small k3s deployments.

This repository is a **Bun monorepo** managed with workspaces:

```
apps/
  storeagent/ — Hono HTTP API (Bun + TypeScript + RxJS)
  frontend/   — SvelteKit web UI
```

## Documentation

See the [docs/](docs/) folder.
