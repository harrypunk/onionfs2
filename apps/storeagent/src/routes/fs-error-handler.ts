import type { Context } from "hono";
import { FsErrorCode } from "@/lib/fs-error";

/**
 * Convert a filesystem error into the appropriate HTTP Response.
 */
export function fsErrorResponse(
	c: Context,
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
