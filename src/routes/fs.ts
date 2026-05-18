import { Hono } from "hono";
import { firstValueFrom } from "rxjs";
import { listDir } from "../services/fs";

const fsRoutes = new Hono();

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
