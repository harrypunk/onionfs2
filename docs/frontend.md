# Frontend

The frontend is a SvelteKit application that provides a web UI for browsing the distributed filesystem. It connects to the cluster NATS server over WebSocket to receive live node announcements and mount updates.

The `ONIONFS_NATS_URL` environment variable sets the WebSocket NATS endpoint (e.g. `ws://nats.lan:80`).
