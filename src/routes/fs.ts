import { type Context, Hono } from "hono";
import { firstValueFrom } from "rxjs";
import { FsErrorCode } from "@/lib/fs-error";
import { resolvePath } from "@/middleware/resolve-path";
import { validatePath } from "@/middleware/validate-path";
import { getFileContent, listDir } from "@/services/fs";
import type { Variables } from "@/types";

/** Extended variables available inside `/fs` routes after middleware runs. */
type FsVariables = Variables & {
	realPath: string;
};

/** Hono sub-router for file-system endpoints under `/fs`. */
const fsRoutes = new Hono<{ Variables: FsVariables }>();

fsRoutes.use(validatePath);
fsRoutes.use(resolvePath);

/**
 * Convert a filesystem error into the appropriate HTTP Response.
 */
function fsErrorResponse(
	c: Context<{ Variables: FsVariables }>,
	err: unknown,
	fallbackMessage: string,
): Response {
	if (err && typeof err === "object" && "code" in err) {
		const code = String(err.code);
		const message = err instanceof Error ? err.message : fallbackMessage;

		switch (code) {
			case FsErrorCode.NotFound:
				return c.json({ error: message }, 404);
			case FsErrorCode.AccessDenied:
			case FsErrorCode.PermissionDenied:
				return c.json({ error: message }, 403);
			case FsErrorCode.NotAFile:
				return c.json({ error: message }, 400);
			default:
				return c.json({ error: message }, 500);
		}
	}
	return c.json({ error: fallbackMessage }, 500);
}

/**
 * Build response headers for a file download or range response.
 */
function fileHeaders(
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

/**
 * Parse a single `bytes=start-end` Range header.
 *
 * @returns Parsed range or `undefined` if the header is missing/malformed.
 */
function parseRangeHeader(
	header: string | undefined,
): { start: number; end?: number } | undefined {
	if (!header) return undefined;
	const match = header.match(/^bytes=(\d+)-(\d*)$/);
	if (!match) return undefined;
	const start = Number.parseInt(match[1], 10);
	const end = match[2] ? Number.parseInt(match[2], 10) : undefined;
	if (end !== undefined && start > end) return undefined;
	return { start, end };
}

/**
 * GET /fs/list?mount=<name>&dir=<path>
 *
 * Lists the contents of a directory inside a mount.
 *
 * Validation and path resolution are handled upstream by middleware:
 * - `validatePath` returns 400 for malformed mount/file params.
 * - `resolvePath` returns 404/403 for missing mounts or path traversal.
 */
fsRoutes.get("/list", (c) => {
	const realPath = c.var.realPath;

	return firstValueFrom(listDir(realPath)).then(
		(result) => c.json(result),
		(err) => fsErrorResponse(c, err, "Failed to read directory"),
	);
});

/**
 * GET /fs/get?mount=<name>&dir=<path>
 *
 * Streams a file from a mount. Supports optional `Range` header for
 * partial content (bytes=start-end).
 */
fsRoutes.get("/get", (c) => {
	const realPath = c.var.realPath;
	const range = parseRangeHeader(c.req.header("range"));

	return firstValueFrom(getFileContent(realPath, range)).then(
		({ stream, size }) => {
			if (range) {
				if (range.start >= size) {
					return c.body(null, 416, {
						"Content-Range": `bytes */${size}`,
					});
				}
				const actualEnd = Math.min(range.end ?? size - 1, size - 1);
				const contentLength = actualEnd - range.start + 1;
				return new Response(stream, {
					status: 206,
					headers: fileHeaders(
						size,
						contentLength,
						`${range.start}-${actualEnd}`,
					),
				});
			}
			return new Response(stream, {
				status: 200,
				headers: fileHeaders(size),
			});
		},
		(err) => fsErrorResponse(c, err, "Failed to read file"),
	);
});

export default fsRoutes;
