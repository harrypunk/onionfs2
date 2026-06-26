import { createMiddleware } from "hono/factory";
import type { FilePathVariables } from "@/types";

type ResolveFileIdVariables = FilePathVariables;

/**
 * Looks up `/file/:mount/:id` in the FileIndex and exposes mount,
 * relativePath, and realPath through `c.var` so downstream handlers can reuse
 * the same file-serving logic as `/fs/get`.
 */
export const resolveFileId = createMiddleware<{
	Variables: ResolveFileIdVariables;
}>(async (c, next) => {
	const mount = c.req.param("mount");
	const id = c.req.param("id");

	if (!mount || !/^[a-zA-Z0-9]+$/.test(mount)) {
		return c.json({ error: "Invalid mount name" }, 400);
	}

	if (!id) {
		return c.json({ error: "File id is required" }, 400);
	}

	const resolved = c.var.fileIndex.lookup(mount, id);
	if (!resolved) {
		return c.json({ error: "File not found" }, 404);
	}

	c.set("mount", resolved.mount);
	c.set("relativePath", resolved.relativePath);
	c.set("realPath", resolved.realPath);
	return next();
});
