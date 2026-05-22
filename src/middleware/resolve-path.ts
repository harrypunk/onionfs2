import { createMiddleware } from "hono/factory";
import { firstValueFrom } from "rxjs";
import { resolveFilePath } from "@/lib/path-resolver";
import type { Variables } from "@/types";

type ResolvePathVariables = Variables & {
	realPath: string;
};

/**
 * Resolves the logical file coordinates (mount + file) to an absolute
 * physical path and stores it in `c.var.realPath`.
 *
 * Must run **after** `validatePath` middleware so `mount` and `file`
 * are guaranteed to be present and well-formed.
 */
export const resolvePath = createMiddleware<{
	Variables: ResolvePathVariables;
}>(async (c, next) => {
	const mount = c.req.query("mount") ?? "";
	const file = c.req.query("file") ?? "";
	const cfg = c.get("config");

	return firstValueFrom(resolveFilePath(cfg.mounts, mount, file)).then(
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
