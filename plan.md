# onionfs Project Plan

## Current Status

Last updated: 2026-06-27

The project is a functional local prototype of a distributed filesystem agent.
The backend can serve files, accept uploads, and announce itself over NATS.
The frontend can display a live node overview, browse directories inside each node mount with sorting and icons, switch between list and grid views, select entries via checkboxes for bulk actions, and preview images/videos or download other file types.
Phase 7 (list/grid view and selection toolbar) and Phase 8 (file preview and download) are finished.
Phase 9 (upload files) and later phases are pending.

Working tree is clean; last commit is `14df405` (replace native video player with ArtPlayer).

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
  - Clicking a mount navigates to `/file/{node}/{mount}/`
  - Catch-all route `/file/{node}/{mount}/[[id]]/` supports arbitrary subdirectory URLs; the path is encoded as a reversible base64url id
  - Page discovers the node via NATS and lists directories via the agent's `GET /fs/list` API
  - Breadcrumb navigation (`Home / Node / Mount / subdir1 / subdir2`) with clickable segments
  - Sortable columns (name, type, size) with `SortKey` enum and boolean direction
  - List/grid view toggle (`ViewMode`) with `EntryRow` and `EntryCard` layouts
  - Checkbox selection with select-all and a bulk-action toolbar (`SelectionToolbar`)
  - Simplified type column: "D" for directories, empty for files
  - Full-row click areas for mounts and file entries
  - Lucide icons (home, folder, file, hard-drive) and human-readable size formatting
- **File preview**
  - Dedicated `/preview/{node}/{mount}/{id}` route
  - Preview component registry maps `FileCategory` to viewer components
  - Images rendered with a native `<img>` viewer
  - Videos rendered with **ArtPlayer** (fullscreen, pip, settings, playback rate, aspect ratio)
  - Other files show a download fallback
- **Dependency injection**
  - `AppContainer` wires `UrlHelper`, `NatsNodeDataSource`, `NodeInfoMg`, and view-models
  - `UrlHelper` builds browse/preview URLs and is injectable for tests
- **Components**
  - `NodeOverview`, `NodeCard`, `MountTable`
  - `PathBreadcrumb`, `EntryTable`, `EntryTableHeader`, `EntryRow`, `EntryCard`, `FileGrid`, `SelectionToolbar`, `ViewToggle`
  - `ImagePreview`, `VideoPreview`, `FallbackPreview`
- **State**
  - `NodeState` class using `SvelteMap` and `$state`/`$derived`/`$effect`
  - `FileBrowserViewModel` and `PreviewViewModel` own loading, error handling, and URL generation

### Shared Package — `packages/shared`

- `AnnounceMessage` interface
- `NATS_SUBJECTS` and `NATS_STREAMS` constants

## What's Not Done / Known Gaps

These are the current limitations and areas for future work:

- **Cross-node file operations** — the API only reads/writes the local node's filesystem. There is no node-to-node proxying, replication, or distributed routing yet.
- **No authentication or authorization** — all API endpoints are open.
- **In-memory upload sessions** — multipart session state is stored in `InMemoryUploadSessionManager`; restarting the agent loses active uploads.
- **No file deletion/rename API** — only list/get/upload operations exist.
- **Bulk actions are UI-only** — the selection toolbar and checkboxes exist, but actions are not wired to backend endpoints.
- **Frontend error UX is minimal** — NATS disconnections show a single error banner; no retry/back-off UI.
- **Image viewer is basic** — the current image preview uses a plain `<img>` tag. A richer viewer with zoom/slides (e.g., PhotoSwipe) is planned but not implemented.

## Recent Changes

- Extracted README documentation into `docs/` and simplified `README.md`.
- Added CORS middleware to the agent so the browser can call its HTTP API directly.
- Added a mount browser at `/file/{node}/{mount}/[[id]]/` with subdirectory browsing, clickable breadcrumbs, sorting, and icons.
- Extracted `PathBreadcrumb`, `EntryTable`, `EntryTableHeader`, and `EntryRow` components.
- Added `lucide-svelte` for UI icons and human-readable file size formatting.
- Moved `FsEntry` and added `SortKey` enum to `$lib/types.ts`.
- Added `docs/filesystem-urls.md` documenting the URL structure.
- Storeagent updates JetStream `max_age` on startup to match `2× announce_interval_sec`.
- Added list/grid view toggle and `EntryCard`/`FileGrid` components for the mount browser.
- Replaced the planned per-row dropdown menu with checkbox selection and a bulk-action toolbar (`SelectionToolbar`) for simpler mobile and desktop UX.
- Simplified the type column to "D" for directories and empty for files.
- Introduced `AppContainer` for dependency injection and refactored `UrlHelper` into an injectable class.
- Added a preview component registry (`ImagePreview`, `VideoPreview`, `FallbackPreview`) and `/preview/{node}/{mount}/{id}` route.
- Replaced the native `<video>` player with **ArtPlayer**.
- Made mount rows and file-entry rows fully clickable.

## Roadmap / Phases

### Phase 7 — Directory listing view modes and file actions UX ✅

Add a list/grid toggle for the mount browser and a selection-based file-actions UI.

- **List / grid toggle**
  - Reuse the existing data source and avoid duplicating large table markup.
  - Render rows/cards from the same `FsEntry` data, keeping `EntryRow`/`EntryTable` composable.
- **File actions UX**
  - Use a checkbox on each `EntryRow` and `EntryCard` instead of a per-row dropdown menu.
  - When one or more entries are selected, show a bulk-action toolbar above the table/grid.
  - **Why checkboxes instead of a dropdown menu or long-press?**
    - Dropdown menus are hard to get right across screen sizes: they need absolute positioning, collision detection, focus trapping, and a backdrop to close on outside clicks. On mobile they often end up too small or off-screen.
    - A long-press menu was prototyped but turned out to be harder to implement reliably than expected:
      - **Gesture ambiguity**: the same pointer sequence is used for tap (open/navigate), scroll, drag-to-select, and long-press. Distinguishing them requires timers, movement thresholds, and careful handling of `pointerdown`/`pointerup`/`pointermove`/`touchstart`/`touchend` across devices.
      - **Native context-menu conflict**: browsers fire a native `contextmenu` event on long-press, especially on touch and macOS trackpads. Suppressing it needs `preventDefault` at the right time, but doing so can also block useful native behavior like text selection or link previews.
      - **Release-vs-menu interaction**: when the menu appears while the user is still holding the pointer down, lifting the pointer must not immediately trigger a click on the row or the first menu item. Preventing that click without breaking normal menu-item clicks requires tracking whether the release was part of the long-press and selectively stopping propagation.
      - **Scroll/long-press race**: if the user starts a long-press and then slightly moves the finger, did they intend to scroll or to keep holding? Picking a single timeout works for one case but feels wrong for the other.
      - **Reusable-action tension**: a clean Svelte action would only report "this element is long-pressed", but the menu still needs to know anchor position, viewport edges, and focus. A richer action ends up coupling the gesture detector to menu-specific DOM knowledge, which is the opposite of a reusable primitive.
      - **Accessibility**: long-press has no keyboard equivalent, so a separate keyboard-accessible menu path would still be needed.
    - Checkboxes are simple, native, accessible, and work identically in list and grid views. They also scale naturally from single-file actions to multi-select bulk actions, so the same toolbar can handle both cases without separate menu implementations.
  - Bulk actions shown in the toolbar: **Download**, **Rename** (disabled unless exactly one item is selected), **Copy**, **Move**, **Delete**, and **Clear selection**.
  - `FileList` and `FileGrid` provide a select-all checkbox; selected rows/cards are highlighted.
  - The actual action handlers (open/download, rename, copy/move, delete) will be wired to backend endpoints in later phases; this phase defines only the selection shell and toolbar.

### Phase 8 — Open files in the browser ✅

Clicking an image or video opens a preview viewer in the browser; other file types trigger a download.

#### URL design

The current filesystem URL pattern is:

```
myfs.lan/{node}/{mount}/dir1/dir2/example.jpg
```

This works for browsing but conflicts with viewer URLs like `myfs.lan/preview/...` if a node or directory is ever named `preview`, `file`, `view`, etc. To avoid reserving common words inside the filesystem namespace, introduce dedicated top-level route prefixes:

```
myfs.lan/file/{node}/{mount}/dir1/dir2/example.jpg    — raw file / direct link
myfs.lan/preview/{node}/{mount}/dir1/dir2/example.jpg — preview/viewer page
```

- `/file/...` serves the file directly (uses agent `GET /fs/get`).
- `/preview/...` renders the appropriate viewer based on MIME type (image, video, or generic download).
- Both encode the full filesystem path after the prefix, so there is no ambiguity with node/mount names.

Alternatives to evaluate:

- `?preview=1` query parameter on the existing filesystem URL — simple but couples browsing and viewer state.
- `/preview?path=/{node}/{mount}/.../example.jpg` — avoids nested path encoding but requires URL-safe path serialization.

#### Viewer details

- **Images**
  - Provide a user-friendly viewer with zoom and basic metadata.
  - The current implementation uses a plain `<img>` tag.
  - **TBD — PhotoSwipe**: evaluate/integrate PhotoSwipe for slides, zoom, touch gestures, and captions. Slide navigation requires fetching the directory listing and filtering image neighbors.
  - The agent's `GET /fs/get` already supports byte-range requests, so large images can be fetched efficiently if the viewer supports chunked loading.
- **Video**
  - Use **ArtPlayer** for playback (replaces the earlier **Video.js** plan).
  - Stream via `GET /fs/get` using the existing `Range: bytes=` support so large files don't need to be fully buffered in memory.
- **General large files**
  - Reuse the agent's existing `Range` header support for any viewer or player that requests partial content.

### Phase 9 — Upload files

Add file upload to the mount browser.

#### Small files

Use the existing `POST /fs/upload?mount=<name>&dir=<path>` endpoint. The request body is streamed directly to disk.

#### Large files

Use the existing multipart flow:

1. `POST /fs/multipart/init?mount=<name>&file=<path>` — creates a session and returns an `uploadId`.
2. `POST /fs/multipart/upload?uploadId=<id>&partNumber=<n>` — upload chunks.
3. `POST /fs/multipart/complete?uploadId=<id>` — concatenate parts and write the final file.

Chunk size should be large enough to reduce HTTP overhead (e.g. 5–10 MB) but small enough to allow pause/resume without re-uploading too much data.

#### Pause, cancel, and resume

- **Pause**: stop sending parts; keep the `uploadId` and already-uploaded part files on the agent.
- **Cancel**: delete the session and temporary part folder.
- **Resume**: re-list already-uploaded parts for the `uploadId`, then continue from the next missing part number.

The current `InMemoryUploadSessionManager` stores sessions in memory, so resuming fails if the agent restarts. To support real resume, persist sessions and part progress to:

- JetStream KV (fits the existing NATS infrastructure), or
- A small SQLite/database file on the agent, or
- A metadata file inside the temporary part folder.

The frontend should also keep the `uploadId` in local state/storage so the user can resume after a page refresh.

#### Directory-change notifications

After a successful upload (or delete/rename in future phases), the agent could publish a message so the frontend refreshes the directory listing automatically.

Options:

- **NATS pub/sub subject** such as `onionfs.fs.change.{node_id}.{mount}.{path}` — lightweight, but ephemeral; late subscribers miss events.
- **JetStream stream/KV** — durable; the frontend can replay missed events after reconnecting.

Start with a simple pub/sub notification and move to JetStream if durability is needed. The frontend subscribes to changes for the currently viewed directory and re-fetches `GET /fs/list` when a change event arrives.

### Phase 10 — Same-node copy / move

Copy or move files/directories within the same agent node.

- Backend: add `POST /fs/copy` and `POST /fs/move` endpoints.
- Both source and target paths resolve to the same node, so the agent can perform a local filesystem operation.
- Use atomic rename for moves when possible (`Bun.file().move` or `node:fs/promises.rename`).
- For copies, stream from source to target to avoid loading large files into memory.
- Publish a directory-change notification so the frontend refreshes the affected directories.

### Phase 11 — Cross-node copy / move

Copy or move files/directories between different agent nodes.

- The source agent streams the file to the target agent over HTTP using `GET /fs/get` (with `Range` support for resumes).
- The target agent writes using `POST /fs/upload` or the multipart flow.
- For directories, enumerate entries on the source and transfer each file recursively.
- Authentication and checksum verification are important here because data leaves the local node.
- This phase should reuse the upload and download building blocks from Phases 8 and 9 rather than introducing a separate transfer protocol.

### Phase 12 — Pause / cancel / resume for copy / move

Extend copy and move operations with pause, cancel, and resume.

Design goals:

- **Composable**: pause/resume logic should be a thin wrapper around the same chunk/stream primitives used for upload and cross-node copy, not a separate NATS-heavy protocol.
- **Simple state machine**: each transfer has an ID and tracks `(sourcePath, targetPath, bytesTransferred, status)`. Status values: `running`, `paused`, `cancelled`, `completed`, `failed`.
- **Local persistence**: store transfer state on the target agent so resume works after a page refresh or agent restart. Options:
  - JetStream KV (reuses existing NATS setup),
  - SQLite on the agent,
  - A small JSON metadata file next to the partial target.
- **Avoid overcomplicating NATS**: use NATS only for lightweight status broadcasts (e.g. `onionfs.transfer.status.{transferId}`) and directory-change notifications. Do not route actual file bytes through NATS; always use HTTP streams for data.
- **Frontend**: show transfer progress, allow pause/cancel, and resume from stored transfer ID.

### Phase 13 — Rename / delete files and directories

Add basic filesystem mutation operations for individual files and directories.

- Backend:
  - `POST /fs/rename?mount=<name>&dir=<path>` with a JSON body `{ oldName, newName }`.
  - `DELETE /fs/delete?mount=<name>&dir=<path>` with the target name in a query parameter or JSON body.
- Validate that `oldName`/`newName` are safe relative names without path separators or traversal.
- Reject renaming or deleting mount roots; operations must target entries inside a mount.
- For directories, recursively delete contents before removing the directory itself.
- Use atomic filesystem operations where available (`rename` for renames, `rm -r` equivalent for deletes).
- Publish directory-change notifications on `onionfs.fs.change.{node_id}.{mount}.{path}` so the frontend refreshes automatically.

This phase is intentionally simple and should reuse the existing path validation and directory-change notification plumbing from earlier phases.

### Phase 14 — Bulk action backend integration

The multi-select UI (checkboxes, select-all, bulk-action toolbar) is implemented in Phase 7. This phase wires those toolbar actions to batch backend endpoints and adds advanced selection interactions.

#### Remaining UX work

- **Range selection**
  - On desktop, support `Shift` + click to select a range of entries.
  - On desktop, `Ctrl`/`Cmd` + click toggles individual entries.
- **Confirmation dialogs**
  - Show a single confirmation dialog for bulk delete listing the number of items.
  - For copy/move, show a destination picker and construct target paths by preserving entry names under the chosen directory.

#### Bulk actions

The existing single-target actions should accept a list of paths:

- **Copy / Move**
  - Phase 10/11 copy/move endpoints accept an array of `{ sourcePath, targetPath }` pairs.
  - Bulk flow: choose a destination directory, then the frontend constructs target paths by preserving entry names under the destination.
- **Delete**
  - Phase 13 delete endpoint accepts an array of `{ mount, dir, name }` entries.
  - Show a single confirmation dialog listing the number of items to delete.
- **Download**
  - For a single file, trigger a direct download.
  - For multiple files or directories, stream a ZIP archive from a new `POST /fs/download/zip` endpoint.

#### API design

- Extend Phase 10–13 endpoints to accept batch payloads where it makes sense:
  - `POST /fs/copy` body: `{ mount, pairs: [{ sourceDir, sourceName, targetDir, targetName }] }`.
  - `POST /fs/move` body: same shape as copy.
  - `DELETE /fs/delete` body: `{ mount, items: [{ dir, name }] }`.
  - `POST /fs/download/zip` body: `{ mount, items: [{ dir, name }] }` — returns a streamed ZIP.
- For mixed cross-node selections, group items by source node and run one transfer job per node.
- Report per-item results so the frontend can show which entries succeeded or failed without aborting the whole batch.

#### Integration with existing components

- `EntryRow` and `EntryCard` already expose `selected`/`onToggle` props.
- `EntryTable` already tracks the selected set and renders the bulk action bar via `SelectionToolbar`.
- Reuse the per-file action logic from Phase 8–13 by wrapping it for bulk selection; avoid duplicating confirmation dialogs and destination pickers.
