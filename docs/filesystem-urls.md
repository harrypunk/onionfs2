# Filesystem URL Structure

## Overview

The system uses two URL spaces:

1. **Frontend SvelteKit routes** — human-facing browser/preview URLs.
2. **Agent HTTP API routes** — backend endpoints served by each store agent.

The frontend routes encode the logical filesystem path as a reversible, URL-safe id so that special characters and nested paths do not leak into the URL structure. The agent accepts either the same id-based format or the raw mount + path as query parameters.

---

## Frontend Routes

### Browse a directory

```text
/file/{node}/{mount}/{id}
```

- `node` — agent node ID (e.g. `node2`).
- `mount` — logical mount name configured on that agent (e.g. `mount3`).
- `id` — base64url-encoded relative path inside the mount. Empty for the mount root.

Examples:

- `/file/node2/mount3/` — root of `mount3` on `node2`.
- `/file/node2/mount3/Zm9sZGVy` — `folder` directory (`id` decodes to `folder`).
- `/file/node2/mount3/Zm9sZGVyL3N1YmZvbGRlcg` — `folder/subfolder` directory.

Trailing slashes are enforced by `trailingSlash: "always"` on the browser route.

### Preview a file

```text
/preview/{node}/{mount}/{id}
```

Same parameter semantics as the browse route, but `id` must decode to a file path. The preview page builds a direct agent URL and renders the file with an appropriate preview component.

Examples:

- `/preview/node2/mount3/cGhvdG9zL2NhdC5qcGc` — preview `photos/cat.jpg`.

---

## Agent API Routes

Each agent exposes the filesystem under the following HTTP routes.

### Mount discovery

```text
GET /mount/list
```

Returns the list of configured mount names on the agent.

```json
{
  "mounts": ["mount1", "mount3"]
}
```

Mount names are restricted to alphanumeric characters (`^[a-zA-Z0-9]+$`).

### Directory listing

```text
GET /fs/list?mount=<name>&dir=<path>
```

Lists entries inside a directory. The response includes a reversible `id` for each file entry.

```json
{
  "path": "/real/path/on/disk",
  "entries": [
    { "name": "folder", "type": 1 },
    { "name": "cat.jpg", "type": 2, "id": "cGhvdG9zL2NhdC5qcGc" }
  ]
}
```

- `mount` — logical mount name.
- `dir` — relative directory path inside the mount. Empty for the mount root.

### Stream a file by path

```text
GET /fs/get?mount=<name>&dir=<path>
```

Streams a file. Supports optional `Range` header for partial content.

- For files, use `file=<path>` or `dir=<path>` (both are resolved identically).

### Stream a file by id

```text
GET /file/{mount}/{id}
```

Streams a file using the encoded relative path id. This is the URL generated for previews and direct links. It reuses the same serving logic as `/fs/get`.

### Upload a file

```text
POST /fs/upload?mount=<name>&dir=<path>
```

Single-shot upload. The request body is written to the resolved path.

### Multipart upload

```text
POST /fs/multipart/init?mount=<name>&file=<path>
POST /fs/multipart/upload?uploadId=<id>&partNumber=<n>
POST /fs/multipart/complete?uploadId=<id>
```

Used for large or resumable uploads:

1. `init` creates a session and returns an `uploadId`.
2. `upload` sends each part as the request body.
3. `complete` concatenates the parts, writes the final file, and cleans up.

---

## Path Encoding

The frontend and agent share a reversible encoding from relative paths to URL-safe ids.

- Encode: UTF-8 relative path → base64url (no padding).
- Decode: base64url id → UTF-8 relative path.
- Implementation: `@onionfs2/shared` (`encodePathId` / `decodePathId`).

Because the encoding is reversible, the agent does not need a server-side lookup table to resolve `/file/{mount}/{id}`.

### Why encode the path?

- Keeps URLs readable at the segment level (`/file/node2/mount3/...`).
- Avoids escaping issues with slashes, spaces, and Unicode characters in path components.
- Allows the same id to be used in frontend routes and agent direct links.

---

## Mapping Frontend URLs to Agent API

The browser page converts the URL segments into agent calls:

1. Look up the node's `publicUrl` by `node` id.
2. Decode the `id` parameter to get the relative filesystem path.
3. Call the agent:
   - Directory: `GET http://{publicUrl}/fs/list?mount={mount}&dir={path}`
   - File preview: `GET http://{publicUrl}/file/{mount}/{id}`

`UrlHelper` in `apps/frontend/src/lib/url-helpers.ts` is the single place that builds frontend URLs from `(nodeId, mountName, path)` tuples.

---

## Security Boundaries

- Mount names must match `^[a-zA-Z0-9]+$`.
- Path resolution validates that the final real path stays inside the mount base directory; traversal outside the mount is rejected with `403`.
- The `id` in `/file/{mount}/{id}` is decoded and validated the same way as query-based paths.

---

## Future Considerations

- File view URLs could share the same `/file/{node}/{mount}/{id}` route with no trailing slash, distinguishing files from directories by URL shape.
- Search or filtered listings may add query parameters to `/fs/list` without changing the URL structure.
- Copy/move/rename/delete operations will be added under `/fs/*` and follow the same `mount` + `dir`/`file` query convention.
