import { decodePathId, encodePathId } from "@onionfs2/shared";
import type { Result } from "@onionfs2/shared";

export type ResolveFn = (
	routeId: string,
	params: Record<string, string>,
) => string;

/** Builds app-internal URLs for browsing and previewing files. */
export class UrlHelper {
	readonly #resolve: ResolveFn;
	readonly #fileSlug: string;
	readonly #previewSlug: string;

	constructor(resolve: ResolveFn, fileSlug: string, previewSlug: string) {
		this.#resolve = resolve;
		this.#fileSlug = fileSlug;
		this.#previewSlug = previewSlug;
	}

	buildBrowseUrl(nodeId: string, mountName: string, dir = ""): string {
		const id = encodePathId(dir);
		return this.#resolve(this.#fileSlug, {
			node: nodeId,
			mount: mountName,
			id,
		});
	}

	buildPreviewUrl(nodeId: string, mountName: string, filePath: string): string {
		const id = encodePathId(filePath);
		return this.#resolve(this.#previewSlug, {
			node: nodeId,
			mount: mountName,
			id,
		});
	}
}

/**
 * Extracts the file name from a reversible path id.
 *
 * A path id is a base64url-encoded relative path (e.g. "photos/cat.jpg").
 * This function decodes the id and returns only the last path segment,
 * which is the file or folder name shown in the UI. Empty paths and
 * decode failures are propagated to the caller.
 */
export function fileNameFromPathId(id: string): Result<string> {
	const result = decodePathId(id);
	if (!result.ok) {
		return result;
	}
	const segments = result.value.split("/");
	return { ok: true, value: segments[segments.length - 1] };
}
