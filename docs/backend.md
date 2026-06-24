# Backend

## Configuration

The agent loads its configuration from:

```
/opt/storeagent/config.json
```

Override the path via the `CONFIG_PATH` environment variable:

```sh
CONFIG_PATH=/custom/config.json bun run --filter storeagent dev
```

Copy the example file and install it at the default path:

```sh
sudo mkdir -p /opt/storeagent
sudo cp config.example.agent.json /opt/storeagent/config.json
```

## Config Fields

| Field                   | Description                                                                                                        |
| ----------------------- | ------------------------------------------------------------------------------------------------------------------ |
| `bind_addr`             | HTTP listen IP address (e.g. `0.0.0.0`)                                                                            |
| `bind_port`             | HTTP listen port (e.g. `3001`)                                                                                     |
| `nats_server`           | NATS endpoint for cluster coordination and JetStream messaging                                                     |
| `mounts`                | Map of logical mount name → absolute physical directory path                                                       |
| `node_id`               | Unique identifier for this agent instance                                                                          |
| `cluster_url`           | Internal cluster address used for node-to-node communication (auto-generated from k8s Service in Helm deployments) |
| `public_url`            | Publicly reachable address for client access                                                                       |
| `announce_interval_sec` | Heartbeat interval in seconds for NATS presence announcements                                                      |

## Example `config.json`

```json
{
  "bind_addr": "0.0.0.0",
  "bind_port": 3001,
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
