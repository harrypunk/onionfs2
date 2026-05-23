import { Hono } from "hono";
import { firstValueFrom } from "rxjs";
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
		(err) => {
			if (err.code === "ENOENT") {
				return c.json({ error: "Directory not found" }, 404);
			}
			if (err.code === "EACCES" || err.code === "EPERM") {
				return c.json({ error: "Permission denied" }, 403);
			}
			return c.json({ error: err.message || "Failed to read directory" }, 500);
		},
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
		({ stream, size, range }) => {
			if (range) {
				if (range.start >= size) {
					stream.destroy();
					return c.body(null, 416, {
						"Content-Range": `bytes */${size}`,
					});
				}
				const actualEnd = Math.min(range.end ?? size - 1, size - 1);
				const contentLength = actualEnd - range.start + 1;
				return new Response(stream as unknown as ReadableStream, {
					status: 206,
					headers: {
						"Content-Type": "application/octet-stream",
						"Content-Length": String(contentLength),
						"Content-Range": `bytes ${range.start}-${actualEnd}/${size}`,
						"Accept-Ranges": "bytes",
					},
				});
			}
			return new Response(stream as unknown as ReadableStream, {
				status: 200,
				headers: {
					"Content-Type": "application/octet-stream",
					"Content-Length": String(size),
					"Accept-Ranges": "bytes",
				},
			});
		},
		(err) => {
			if (err.code === "ENOENT") {
				return c.json({ error: "File not found" }, 404);
			}
			if (err.code === "EACCES" || err.code === "EPERM") {
				return c.json({ error: "Permission denied" }, 403);
			}
			if (err.code === "EISDIR") {
				return c.json({ error: "Cannot read a directory as a file" }, 400);
			}
			return c.json({ error: err.message || "Failed to read file" }, 500);
		},
	);
});

export default fsRoutes;
