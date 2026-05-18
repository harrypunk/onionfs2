import { Hono } from "hono";
import { firstValueFrom } from "rxjs";
import { listDir } from "../services/fs";

/** Hono sub-router for file-system endpoints under `/fs`. */
const fsRoutes = new Hono();

/**
 * GET /fs/list?path=<dir>
 *
 * Lists the contents of a directory, defaulting to the current working
 * directory when `path` is omitted.
 *
 * Errors from the underlying fs calls are mapped to appropriate HTTP status:
 * - 404: directory does not exist (ENOENT)
 * - 403: permission denied (EACCES / EPERM)
 * - 500: everything else
 *
 * The handler converts the cold Observable returned by `listDir` into a
 * Promise via `firstValueFrom`, then chains `.then` for success / error
 * responses without using async/await syntax.
 */
fsRoutes.get("/list", (c) => {
	const targetPath = c.req.query("path") ?? ".";

	return firstValueFrom(listDir(targetPath)).then(
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
