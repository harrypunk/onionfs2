export interface AnnounceMessage {
	node_id: string;
	mounts: string[];
	public_url: string;
	cluster_url: string;
	timestamp: number;
}

/**
 * Lightweight, TypeScript-friendly result type.
 *
 * Use this instead of throwing exceptions or returning `undefined` when the
 * caller needs to distinguish success from failure with a typed error value.
 */
export type Result<T, E = string> =
	| { ok: true; value: T }
	| { ok: false; error: E };
