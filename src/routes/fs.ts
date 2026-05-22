import { Hono } from "hono";
import { firstValueFrom } from "rxjs";
import { resolvePath } from "@/middleware/resolve-path";
import { validatePath } from "@/middleware/validate-path";
import { listDir } from "@/services/fs";
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

export default fsRoutes;
