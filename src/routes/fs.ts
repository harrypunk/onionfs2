import { Hono } from "hono";
import { firstValueFrom } from "rxjs";
import { fileHeaders } from "@/lib/file-response";
import { parseRangeHeader } from "@/lib/range";
import { resolvePath } from "@/middleware/resolve-path";
import { validatePath } from "@/middleware/validate-path";
import { fsErrorResponse } from "@/routes/fs-error-handler";
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
