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

### `GET /fs/list?mount=<name>&file=<path>`

List the contents of a directory within a mount.

#### Query Parameters

| Parameter | Required | Format | Description |
|-----------|----------|--------|-------------|
| `mount`   | Yes      | Alphanumeric (`a-zA-Z0-9`) | Logical mount name from config |
| `file`    | No       | Alphanumeric + `/` | Relative directory path inside the mount. Omit or leave empty to list the mount root. |

#### Examples

```sh
# List mount root
curl "http://localhost:3000/fs/list?mount=data1&file="

# List a subdirectory
curl "http://localhost:3000/fs/list?mount=nvme1&file=photos/2024"
```

#### Success Response (200)

```json
{
  "path": "/mnt/nvme1/photos/2024",
  "entries": [
    { "name": "vacation.jpg", "type": 2 },
    { "name": "thumbnails", "type": 1 },
    { "name": "broken-link", "type": 0 }
  ]
}
```

#### Error Responses

| Status | Condition |
|--------|-----------|
| `400`  | Invalid `mount` name or malformed `file` path |
| `404`  | Mount not found in config, or directory does not exist |
| `403`  | Path traversal detected (resolved path escapes the mount boundary) |
| `500`  | Unexpected filesystem error |

### Path Resolution & Security

Every request passes through two middleware layers:

1. **validatePath** — checks that `mount` and `file` params conform to expected formats. Returns `400` early if either is malformed.
2. **resolvePath** — resolves the logical coordinates to an absolute physical path using `node:path.resolve`, then verifies the result stays within the mount's boundary. Returns `404` for missing mounts or `403` for traversal attempts.

The handler itself never sees invalid or escaped paths.

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
