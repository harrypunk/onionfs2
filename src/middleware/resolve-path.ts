import { createMiddleware } from "hono/factory";
import { firstValueFrom } from "rxjs";
import { FsErrorCode } from "@/lib/fs-error";
import { resolveFilePath } from "@/lib/path-resolver";
import type { Variables } from "@/types";

type ResolvePathVariables = Variables & {
	realPath: string;
};

/**
 * Resolves the logical path coordinates (mount + dir) to an absolute
 * physical path and stores it in `c.var.realPath`.
 *
 * Must run **after** `validatePath` middleware so `mount` and `dir`
 * are guaranteed to be present and well-formed.
 */
export const resolvePath = createMiddleware<{
	Variables: ResolvePathVariables;
}>(async (c, next) => {
	const mount = c.req.query("mount") ?? "";
	const dir = c.req.query("dir") ?? "";
	const cfg = c.get("config");

	return firstValueFrom(resolveFilePath(cfg.mounts, mount, dir)).then(
		(resolved) => {
			c.set("realPath", resolved.realPath);
			return next();
		},
		(err) => {
			if (err.code === FsErrorCode.NotFound) {
				return c.json({ error: err.message }, 404);
			}
			if (
				err.code === FsErrorCode.AccessDenied ||
				err.code === FsErrorCode.PermissionDenied
			) {
				return c.json({ error: err.message }, 403);
			}
			return c.json({ error: err.message || "Failed to resolve path" }, 500);
		},
	);
});
