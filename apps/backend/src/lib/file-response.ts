/**
 * Build response headers for a file download or range response.
 */
export function fileHeaders(
	size: number,
	contentLength?: number,
	rangeSpec?: string,
): Record<string, string> {
	const headers: Record<string, string> = {
		"Content-Type": "application/octet-stream",
		"Content-Length": String(contentLength ?? size),
		"Accept-Ranges": "bytes",
	};
	if (rangeSpec) {
		headers["Content-Range"] = `bytes ${rangeSpec}/${size}`;
	}
	return headers;
}
