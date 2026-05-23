# onon-fs2

A lightweight distributed file system for home LAN, designed to run on k3s clusters.

## Overview

Each node runs a lightweight agent server that exposes a local HTTP API and coordinates with other nodes via NATS JetStream. The system is optimized for low-resource environments — ideal for Raspberry Pi homelab setups or small k3s deployments.

## Configuration

The agent loads its configuration from:

```
/opt/storeagent/config.json
```

Override the path via the `CONFIG_PATH` environment variable:

```sh
CONFIG_PATH=/custom/config.json bun run src/index.ts
```

Copy the example file and install it at the default path:

```sh
sudo mkdir -p /opt/storeagent
sudo cp config.example.agent.json /opt/storeagent/config.json
```

### Config Fields

| Field | Description |
|-------|-------------|
| `bind_addr` | HTTP listen address (e.g. `0.0.0.0:3001`) |
| `nats_server` | NATS endpoint for cluster coordination and JetStream messaging |
| `mounts` | Map of logical mount name → absolute physical directory path |
| `node_id` | Unique identifier for this agent instance |
| `cluster_url` | Internal cluster address used for node-to-node communication |
| `public_url` | Publicly reachable address for client access |
| `announce_interval_sec` | Heartbeat interval in seconds for NATS KV presence |

### Example `config.json`

```json
{
  "bind_addr": "0.0.0.0:3001",
  "nats_server": "nats.lan:4222",
  "mounts": {
    "data1": "/data1",
    "nvme1": "/mnt/nvme1"
  },
  "node_id": "desktop3",
  "cluster_url": "desktop3.svc.local",
  "public_url": "agent1.lan:5001",
  "announce_interval_sec": 300
}
```

## Filesystem API

### `GET /mount/list`

Returns the list of configured mount names.

#### Success Response (200)

```json
{
  "mounts": ["data1", "nvme1"]
}
```

### `GET /fs/list?mount=<name>&dir=<path>`

List the contents of a directory within a mount.

#### Query Parameters

| Parameter | Required | Format | Description |
|-----------|----------|--------|-------------|
| `mount`   | Yes      | Alphanumeric (`a-zA-Z0-9`) | Logical mount name from config |
| `dir`     | No       | Relative path segments starting with a letter | Relative directory path inside the mount. Omit or leave empty to list the mount root. |

#### Examples

```sh
# List mount root
curl "http://localhost:3000/fs/list?mount=data1&dir="

# List a subdirectory
curl "http://localhost:3000/fs/list?mount=nvme1&dir=photos/2024"
```

#### Success Response (200)

```json
{
  "path": "/mnt/nvme1/photos/2024",
  "entries": [
    { "name": "vacation.jpg", "type": 2, "size": 2048000 },
    { "name": "thumbnails", "type": 1 },
    { "name": "broken-link", "type": 0 }
  ]
}
```

#### Entry Types

| Value | Name | Description |
|-------|------|-------------|
| `0`   | `Unknown` | Could not determine type (e.g. broken symlink) |
| `1`   | `Directory` | Sub-directory |
| `2`   | `File` | Regular file; `size` is present in bytes |

#### Error Responses

| Status | Condition |
|--------|-----------|
| `400`  | Invalid `mount` name or malformed `dir` path |
| `404`  | Mount not found in config, or directory does not exist |
| `403`  | Path traversal detected (resolved path escapes the mount boundary) |
| `500`  | Unexpected filesystem error |

### `GET /fs/get?mount=<name>&dir=<path>`

Stream a file from a mount. Supports optional `Range` header for partial content.

#### Query Parameters

| Parameter | Required | Format | Description |
|-----------|----------|--------|-------------|
| `mount`   | Yes      | Alphanumeric (`a-zA-Z0-9`) | Logical mount name from config |
| `dir`     | Yes      | Relative path to file | File path inside the mount |

#### Headers

| Header | Required | Example | Description |
|--------|----------|---------|-------------|
| `Range`  | No | `bytes=0-1023` | Request a byte range of the file |

#### Examples

```sh
# Full file
curl -O "http://localhost:3000/fs/get?mount=nvme1&dir=photos/2024/vacation.jpg"

# Partial content (first 1KB)
curl -H "Range: bytes=0-1023" \
  -o partial.bin \
  "http://localhost:3000/fs/get?mount=nvme1&dir=photos/2024/vacation.jpg"
```

#### Success Responses

| Status | Condition | Headers |
|--------|-----------|---------|
| `200` | Full file | `Content-Type`, `Content-Length`, `Accept-Ranges: bytes` |
| `206` | Partial content | `Content-Type`, `Content-Length`, `Content-Range`, `Accept-Ranges: bytes` |
| `416` | Range not satisfiable | `Content-Range: bytes */<size>` |

#### Error Responses

| Status | Condition |
|--------|-----------|
| `400`  | Invalid `mount` name, malformed `dir` path, or target is not a file |
| `404`  | Mount not found, or file does not exist |
| `403`  | Path traversal detected |
| `500`  | Unexpected filesystem error |

## Architecture

The codebase follows a **3-layer architecture** with clear separation of concerns:

```
Route (src/routes/)
  └─ HTTP entry point: parse headers, call services, build Responses

Service (src/services/)
  └─ Business logic: validation rules, orchestration, domain types

Repository (src/repositories/)
  └─ Raw I/O: filesystem operations, no business rules
```

### Path Resolution & Security

Every request passes through two middleware layers:

1. **validatePath** — checks that `mount` and `dir` params conform to expected formats. Returns `400` early if either is malformed.
2. **resolvePath** — resolves the logical coordinates to an absolute physical path using `node:path.resolve`, then verifies the result stays within the mount's boundary. Returns `404` for missing mounts or `403` for traversal attempts.

The handler itself never sees invalid or escaped paths.

### Typed Errors

All filesystem errors are normalized to `FsError` with a typed `FsErrorCode` enum (`ENOENT`, `EACCES`, `EPERM`, `EINVAL`, `EISDIR`). Routes and middleware use these codes — never string comparisons — to map to the correct HTTP status.

## Development

```sh
# Start dev server with hot reload and debug logging
bun run dev

# Run tests
bun test

# Type check
bunx tsc --noEmit

# Lint and format
bunx biome check --write .
```
