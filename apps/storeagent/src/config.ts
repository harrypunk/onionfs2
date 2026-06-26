const DEFAULT_CONFIG_PATH =
	process.env.CONFIG_PATH ?? "/opt/storeagent/config.json";

export interface AppConfig {
	bind_addr: string;
	bind_port: number;
	nats_server: string;
	mounts: Record<string, string>;
	node_id: string;
	cluster_url: string;
	public_url: string;
	announce_interval_sec: number;
	/**
	 * Maximum bytes served for a single range request.
	 * Lower values make video seeking more responsive on slower links.
	 */
	range_chunk_size?: number;
	/**
	 * Maximum number of concurrent file-read preparations inside `/fs/get`.
	 *
	 * This caps how many requests can be preparing a response (stat + slice)
	 * at the same time, which prevents timeline-scrubbing storms from
	 * overwhelming the event loop. It does not throttle Bun's sendfile
	 * streaming phase.
	 */
	max_concurrent_reads?: number;
}

/** Load and return server configuration from the given path. */
export async function loadConfig(
	path = DEFAULT_CONFIG_PATH,
): Promise<AppConfig> {
	return Bun.file(path).json();
}
