# onon-fs2

A lightweight distributed file system for home LAN, designed to run on k3s clusters.

## Overview

Each node runs a lightweight agent server that exposes a local HTTP API and coordinates with other nodes via NATS JetStream. The system is optimized for low-resource environments — ideal for Raspberry Pi homelab setups or small k3s deployments.

## Mount Requirements

The `mounts` config is a map where:

- **Key**: logical mount name. Only alphanumeric characters are allowed (`a-z`, `A-Z`, `0-9`).
- **Value**: absolute physical directory path on the host (e.g. `/mnt/nvme1`).

All filesystem requests must specify:

| Parameter | Description |
|-----------|-------------|
| `node_id` | Target agent node identifier |
| `mount`   | Logical mount name registered in that agent's config |
| `file`    | Relative file path within the mount |

The agent resolves the real path by combining the mount's physical path with the requested file path.

**Example request:**
```
node_id: "mynode1"
mount: "nvme1"
file: "pic/img1.jpg"
```

Resolved to: `/mnt/nvme1/pic/img1.jpg`

## Configuration

When the agent server starts, it loads its configuration from:

```
/etc/storeagent/config.json
```

Copy the example file and install it at that path:

```sh
sudo mkdir -p /etc/storeagent
sudo cp config.example.agent.json /etc/storeagent/config.json
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
