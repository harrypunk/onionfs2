const DEFAULT_CONFIG_PATH =
	process.env.CONFIG_PATH ?? "/opt/storeagent/config.json";

export interface AppConfig {
	bind_addr: string;
	nats_server: string;
	mounts: Record<string, string>;
	node_id: string;
	cluster_url: string;
	public_url: string;
	announce_interval_sec: number;
}

/** Load and return server configuration from the given path. */
export async function loadConfig(
	path = DEFAULT_CONFIG_PATH,
): Promise<AppConfig> {
	return Bun.file(path).json();
}
