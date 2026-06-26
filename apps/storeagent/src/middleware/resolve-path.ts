import { createMiddleware } from "hono/factory";
import { firstValueFrom } from "rxjs";
import { FsErrorCode } from "@/lib/fs-error";
import { resolveFilePath } from "@/lib/path-resolver";
import { log } from "@/logging";
import type { FilePathVariables } from "@/types";

type ResolvePathVariables = FilePathVariables;

/**
 * Resolves the logical path coordinates (mount + dir/file) to an absolute
 * physical path and stores it in `c.var`.
 *
 * Must run **after** `validatePath` middleware so `mount` and the path
 * param (`dir` or `file`) are guaranteed to be present and well-formed.
 */
export const resolvePath = createMiddleware<{
	Variables: ResolvePathVariables;
}>(async (c, next) => {
	const mount = c.req.query("mount") ?? "";
	const relativePath = c.req.query("file") ?? c.req.query("dir") ?? "";
	const cfg = c.get("config");

	return firstValueFrom(resolveFilePath(cfg.mounts, mount, relativePath)).then(
		(resolved) => {
			c.set("mount", resolved.mount);
			c.set("relativePath", resolved.relativePath);
			c.set("realPath", resolved.realPath);
			return next();
		},
		(err) => {
			const summary = `${c.req.method} ${c.req.url} mount=${mount} path=${relativePath}`;
			if (err.code === FsErrorCode.NotFound) {
				log.warn(`Path not found: ${summary}`);
				return c.json({ error: err.message }, 404);
			}
			if (
				err.code === FsErrorCode.AccessDenied ||
				err.code === FsErrorCode.PermissionDenied
			) {
				log.warn(`Path access denied: ${summary}`);
				return c.json({ error: err.message }, 403);
			}
			log.withError(err).error(`Failed to resolve path: ${summary}`);
			return c.json({ error: err.message || "Failed to resolve path" }, 500);
		},
	);
});
