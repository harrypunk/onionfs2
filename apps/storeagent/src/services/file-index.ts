import { join, resolve } from "node:path";
import type { Result } from "@onionfs2/shared";
import { decodePathId, encodePathId } from "@onionfs2/shared";
import type { ResolvedPath } from "@/lib/path-resolver";

/**
 * Result of looking up a mount + id pair.
 */
export type FileIndexLookupResult = Result<ResolvedPath>;

/**
 * Lightweight resolver for `/file/:mount/:id` URLs.
 *
 * The id is a reversible base64url encoding of the relative path inside a
 * mount. No server-side index is required; lookup decodes the id and resolves
 * it against the configured mount base path.
 */
export class FileIndex {
	constructor(private readonly mounts: Record<string, string>) {}

	/**
	 * Scan all configured mounts and populate the index.
	 *
	 * Kept for interface compatibility; the base64url ids are reversible, so
	 * no index build is required.
	 */
	async build(): Promise<void> {
		// no-op
	}

	/** Look up a file by its mount and reversible id. */
	lookup(mount: string, id: string): FileIndexLookupResult {
		const decoded = decodePathId(id);
		if (!decoded.ok) {
			return { ok: false, error: decoded.error };
		}

		if (!/^[a-zA-Z0-9]+$/.test(mount)) {
			return { ok: false, error: "invalid mount name" };
		}

		const basePath = this.mounts[mount];
		if (!basePath) {
			return { ok: false, error: "mount not found" };
		}

		const resolvedBase = resolve(basePath);
		const realPath = resolve(join(resolvedBase, decoded.value));

		// Security boundary: prevent directory traversal.
		if (realPath !== resolvedBase && !realPath.startsWith(`${resolvedBase}/`)) {
			return { ok: false, error: "path traversal detected" };
		}

		return {
			ok: true,
			value: { mount, relativePath: decoded.value, realPath },
		};
	}

	/**
	 * Generate the id for a given mount + relative path.
	 *
	 * The mount is part of the URL, not the id, so it is ignored for encoding
	 * but kept in the signature for callers.
	 */
	getId(_mount: string, relativePath: string): string {
		return encodePathId(relativePath);
	}

	/** Add or update an entry after a successful upload. */
	add(_resolvedPath: ResolvedPath): void {
		// no-op
	}

	/** Remove an entry by its physical path (e.g. after deletion). */
	removeByRealPath(_realPath: string): void {
		// no-op
	}
}
