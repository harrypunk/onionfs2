# Cluster Coordination

Each agent maintains a periodic NATS heartbeat on the `onionfs.agent.announce` subject. The payload includes:

| Field        | Description                           |
| ------------ | ------------------------------------- |
| `node_id`    | Agent identifier                      |
| `mounts`     | Logical → physical mount map          |
| `public_url` | Reachable address for client requests |

Heartbeats run independently of the HTTP server — a NATS failure is logged but does not crash the agent.
