# onionfs Project Plan

## Current Status

Last updated: 2026-06-24

The project is a functional local prototype of a distributed filesystem agent.
The backend can serve files, accept uploads, and announce itself over NATS.
The frontend can display a live node overview and browse the root directory of each node mount.

Working tree is clean; last commit is `38ab20b` (plan.md).

## What's Done

### Backend — `apps/storeagent`

- **HTTP API (Hono + Bun)**
  - `GET /mount/list` — list configured mount names
  - `GET /fs/list?mount=&dir=` — directory listing with file/directory/unknown classification
  - `GET /fs/get?mount=&dir=` — file streaming with optional `Range` byte support
  - `POST /fs/upload?mount=&dir=` — single-shot streamed upload
  - `POST /fs/multipart/init|upload|complete` — multipart upload session flow
- **Path security**
  - `validatePath` middleware enforces alphanumeric mount names and safe relative paths
  - `resolvePath` middleware resolves logical paths to absolute paths and blocks traversal outside mount roots
- **Error handling**
  - Typed `FsError` / `FsErrorCode` enum mapped to HTTP status codes
- **Service layer (RxJS)**
  - `listDir`, `getFileContent` in `src/services/fs.ts`
  - `uploadFile`, `createMultipartSession`, `uploadPart`, `completeMultipartUpload` in `src/services/upload.ts`
- **Repository layer**
  - `src/repositories/fs.ts` wraps Bun-native file I/O (`Bun.file`, `Bun.file().slice()`)
- **Cluster coordination**
  - NATS JetStream heartbeat publisher on `onionfs.agent.announce`
  - Stream setup and `max_age` update on startup
- **Configuration**
  - JSON config loaded from `/opt/storeagent/config.json` (override via `CONFIG_PATH`)
  - Fields: bind address/port, NATS server, mounts, node id, cluster/public URL, announce interval
- **Logging**
  - LogLayer + Pino request logging via Hono middleware
- **Tests**
  - `src/lib/filepath-validate.test.ts`
  - `src/lib/path-resolver.test.ts`
  - `src/services/fs.test.ts`
  - `src/services/upload.test.ts`

### Frontend — `apps/frontend`

- **SvelteKit + Svelte 5 runes**
- **Live node dashboard**
  - Connects to NATS over WebSocket (`nats.ws`)
  - Consumes `agent_heartbeats` JetStream consumer
  - Displays each node's ID, public URL, elapsed time since last heartbeat, and mount list
- **Mount browser**
  - Clicking a mount navigates to `/{node}/{mount}/`
  - Page discovers the node via NATS and lists the mount root via the agent's `GET /fs/list` API
- **Components**
  - `NodeOverview`, `NodeCard`, `MountTable`
- **State**
  - `NodeState` class using `SvelteMap` and `$state`/`$derived`/`$effect`

### Shared Package — `packages/shared`

- `AnnounceMessage` interface
- `NATS_SUBJECTS` and `NATS_STREAMS` constants

## What's Not Done / Known Gaps

These are the current limitations and areas for future work:

- **Cross-node file operations** — the API only reads/writes the local node's filesystem. There is no node-to-node proxying, replication, or distributed routing yet.
- **Subdirectory navigation** — the mount browser only lists the mount root; clicking into folders is not implemented.
- **File downloads from the UI** — the browser page lists entries but cannot open or download files yet.
- **No authentication or authorization** — all API endpoints are open.
- **In-memory upload sessions** — multipart session state is stored in `InMemoryUploadSessionManager`; restarting the agent loses active uploads.
- **No file deletion/rename API** — only list/get/upload operations exist.
- **Frontend error UX is minimal** — NATS disconnections show a single error banner; no retry/back-off UI.

## Recent Changes

- Extracted README documentation into `docs/` and simplified `README.md`.
- Added CORS middleware to the agent so the browser can call its HTTP API directly.
- Added a mount browser page at `/{node}/{mount}/` that lists the mount root.
- Storeagent updates JetStream `max_age` on startup to match `2× announce_interval_sec`.

## Next Steps

*TBD — add prioritized upcoming tasks here.*
