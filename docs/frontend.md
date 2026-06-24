# Frontend

The frontend is a SvelteKit application that provides a web UI for browsing the distributed filesystem. It connects to the cluster NATS server over WebSocket to receive live node announcements and mount updates.

The `PUBLIC_ONIONFS_NATS_URL` environment variable sets the WebSocket NATS endpoint. It must be prefixed with `PUBLIC_` and is read by SvelteKit's `$env/dynamic/public` module. Defaults to `ws://nats.lan:80`.
