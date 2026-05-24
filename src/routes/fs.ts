import { Hono } from "hono";
import { firstValueFrom } from "rxjs";
import { fileHeaders } from "@/lib/file-response";
import { parseRangeHeader } from "@/lib/range";
import { resolvePath } from "@/middleware/resolve-path";
import { validatePath } from "@/middleware/validate-path";
import { fsErrorResponse } from "@/routes/fs-error-handler";
import { getFileContent, listDir } from "@/services/fs";
import {
	completeMultipartUpload,
	createMultipartSession,
	uploadFile,
	uploadPart,
} from "@/services/upload";
import type { Variables } from "@/types";

/** Extended variables available inside `/fs` routes after middleware runs. */
type FsVariables = Variables & {
	realPath: string;
};

/** Hono sub-router for file-system endpoints under `/fs`. */
const fsRoutes = new Hono<{ Variables: FsVariables }>();

/* ------------------------------------------------------------------ */
/*  Routes without path validation                                     */
/* ------------------------------------------------------------------ */

/**
 * POST /fs/multipart/upload?uploadId=<id>&partNumber=<n>
 *
 * Upload a single part (chunk) of a multipart session.
 */
fsRoutes.post("/multipart/upload", (c) => {
	const uploadId = c.req.query("uploadId");
	const partNumber = Number(c.req.query("partNumber"));

	if (!uploadId || Number.isNaN(partNumber)) {
		return c.json({ error: "uploadId and partNumber are required" }, 400);
	}

	const source = c.req.raw.body;
	return firstValueFrom(uploadPart(uploadId, partNumber, source)).then(
		() => c.json({ uploadId, partNumber }),
		(err) => fsErrorResponse(c, err, "Failed to upload part"),
	);
});

/**
 * POST /fs/multipart/complete?uploadId=<id>
 *
 * Finalise a multipart upload: concatenate all parts in order, write to
 * the target path, and clean up the temporary session folder.
 */
fsRoutes.post("/multipart/complete", (c) => {
	const uploadId = c.req.query("uploadId");
	if (!uploadId) {
		return c.json({ error: "uploadId is required" }, 400);
	}

	return firstValueFrom(completeMultipartUpload(uploadId)).then(
		(result) => c.json(result),
		(err) => fsErrorResponse(c, err, "Failed to complete upload"),
	);
});

/* ------------------------------------------------------------------ */
/*  Global middleware — applies to all routes registered below         */
/* ------------------------------------------------------------------ */

fsRoutes.use(validatePath);
fsRoutes.use(resolvePath);

/* ------------------------------------------------------------------ */
/*  Routes with path validation                                        */
/* ------------------------------------------------------------------ */

/**
 * POST /fs/upload?mount=<name>&dir=<path>
 *
 * Simple single-shot file upload.  The request body is written directly
 * to the resolved path.
 */
fsRoutes.post("/upload", (c) => {
	const realPath = c.var.realPath;
	const source = c.req.raw.body;

	return firstValueFrom(uploadFile(realPath, source)).then(
		(result) => c.json(result),
		(err) => fsErrorResponse(c, err, "Failed to upload file"),
	);
});

/**
 * POST /fs/multipart/init?mount=<name>&file=<path>
 *
 * Starts a multipart upload session.  Returns an `uploadId` that must be
 * supplied to `/multipart/upload` and `/multipart/complete`.
 */
fsRoutes.post("/multipart/init", (c) => {
	const realPath = c.var.realPath;
	return firstValueFrom(createMultipartSession(realPath)).then(
		(uploadId) => c.json({ uploadId }),
		(err) => fsErrorResponse(c, err, "Failed to create upload session"),
	);
});

/**
 * GET /fs/list?mount=<name>&dir=<path>
 *
 * Lists the contents of a directory inside a mount.
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
