import { extname } from "node:path";
import type { ByteRange } from "@/lib/range";
import { capRange } from "@/lib/range";

/** Common media types used by the preview player. */
const MIME_TYPES: Record<string, string> = {
	".mp4": "video/mp4",
	".webm": "video/webm",
	".mkv": "video/x-matroska",
	".mov": "video/quicktime",
	".avi": "video/x-msvideo",
	".mp3": "audio/mpeg",
	".wav": "audio/wav",
	".ogg": "audio/ogg",
	".flac": "audio/flac",
	".png": "image/png",
	".jpg": "image/jpeg",
	".jpeg": "image/jpeg",
	".gif": "image/gif",
	".webp": "image/webp",
};

/** Guess a MIME type from a file path. */
export function mimeTypeForPath(path: string): string {
	const ext = extname(path).toLowerCase();
	return MIME_TYPES[ext] ?? "application/octet-stream";
}

/**
 * Build response headers for a file download or range response.
 */
export function fileHeaders(
	size: number,
	contentLength?: number,
	rangeSpec?: string,
	contentType = "application/octet-stream",
): Record<string, string> {
	const headers: Record<string, string> = {
		"Content-Type": contentType,
		"Content-Length": String(contentLength ?? size),
		"Accept-Ranges": "bytes",
		"Content-Disposition": "inline",
	};
	if (rangeSpec) {
		headers["Content-Range"] = `bytes ${rangeSpec}/${size}`;
	}
	return headers;
}

/**
 * Build the HTTP Response for a `GET /fs/get` request.
 *
 * Pure helper: no Hono context, no Observable. Kept separate so the route can
 * compose it inside an RxJS `map` operator.
 */
export function buildFileGetResponse(
	realPath: string,
	effectiveRange: ByteRange | undefined,
	maxChunk: number,
	body: Blob,
	size: number,
): Response {
	const contentType = mimeTypeForPath(realPath);

	if (effectiveRange) {
		if (effectiveRange.start >= size) {
			return new Response(null, {
				status: 416,
				headers: { "Content-Range": `bytes */${size}` },
			});
		}

		const { contentLength, rangeSpec } = capRange(
			size,
			effectiveRange,
			maxChunk,
		);
		return new Response(body, {
			status: 206,
			headers: fileHeaders(size, contentLength, rangeSpec, contentType),
		});
	}

	return new Response(body, {
		status: 200,
		headers: fileHeaders(size, undefined, undefined, contentType),
	});
}
