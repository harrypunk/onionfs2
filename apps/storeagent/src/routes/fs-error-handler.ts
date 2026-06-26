import type { Context } from "hono";
import { FsErrorCode } from "@/lib/fs-error";
import { log } from "@/logging";

/**
 * Convert a filesystem error into the appropriate HTTP Response.
 */
export function fsErrorResponse(
	c: Context,
	err: unknown,
	fallbackMessage: string,
): Response {
	const summary = `${c.req.method} ${c.req.url}`;
	if (err && typeof err === "object" && "code" in err) {
		const code = String(err.code);
		const message = err instanceof Error ? err.message : fallbackMessage;

		switch (code) {
			case FsErrorCode.NotFound:
				log.warn(`File not found: ${summary}`);
				return c.json({ error: message }, 404);
			case FsErrorCode.AccessDenied:
			case FsErrorCode.PermissionDenied:
				log.warn(`File access denied: ${summary}`);
				return c.json({ error: message }, 403);
			case FsErrorCode.NotAFile:
				log.warn(`Not a file: ${summary}`);
				return c.json({ error: message }, 400);
			default:
				log.withError(err).error(`Filesystem error: ${summary}`);
				return c.json({ error: message }, 500);
		}
	}
	log.withError(err).error(`Unhandled filesystem error: ${summary}`);
	return c.json({ error: fallbackMessage }, 500);
}

/**
 * Map an error from `GET /fs/get` to an HTTP Response.
 *
 * Treats "Request aborted" as 499; everything else falls through to the
 * standard filesystem-error mapper.
 */
export function fsGetErrorResponse(
	c: Context,
	err: unknown,
	fallbackMessage: string,
): Response {
	if (err instanceof Error && err.message === "Request aborted") {
		return new Response(null, { status: 499 });
	}
	return fsErrorResponse(c, err, fallbackMessage);
}
