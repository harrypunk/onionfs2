import { createMiddleware } from "hono/factory";
import { firstValueFrom } from "rxjs";
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
			const code = (err as NodeJS.ErrnoException).code;
			if (code === "ENOENT") {
				return c.json({ error: (err as Error).message }, 404);
			}
			if (code === "EACCES" || code === "EPERM") {
				return c.json({ error: (err as Error).message }, 403);
			}
			return c.json(
				{ error: (err as Error).message || "Failed to resolve path" },
				500,
			);
		},
	);
});
