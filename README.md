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

- [Development](docs/development.md) — install, dev servers, tests, and checks
- [Container Images](docs/containers.md) — build, push, and run containers
- [Backend](docs/backend.md) — configuration and config fields
- [Frontend](docs/frontend.md) — frontend overview and environment variables
- [Filesystem API](docs/api.md) — HTTP API reference
- [Cluster Coordination](docs/cluster-coordination.md) — NATS heartbeats
- [Deployment](docs/deployment.md) — Helm install
- [Architecture](docs/architecture.md) — 3-layer design, path resolution, and errors
