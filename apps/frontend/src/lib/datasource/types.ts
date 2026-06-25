import type { NodeInfo } from "$lib/types";

export interface NodeDataSource {
	/** Returns an async iterable of node heartbeats. */
	fetch(): AsyncIterable<NodeInfo>;
}
