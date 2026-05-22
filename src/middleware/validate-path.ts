import { createMiddleware } from "hono/factory";
import type { Variables } from "@/types";

/**
 * Validates that `mount` and `dir` query params conform to expected formats.
 *
 * - mount: alphanumeric only
 * - dir: alphanumeric characters with slashes (no leading slash, no traversal)
 *
 * Returns 400 early if either param is malformed.
 */
export const validatePath = createMiddleware<{ Variables: Variables }>(
	async (c, next) => {
		const mount = c.req.query("mount");
		const dir = c.req.query("dir") ?? "";

		if (!mount || !/^[a-zA-Z0-9]+$/.test(mount)) {
			return c.json({ error: "Invalid mount name" }, 400);
		}

		if (dir.startsWith("/") || (dir !== "" && !/^[a-zA-Z0-9/]+$/.test(dir))) {
			return c.json(
				{
					error: "Invalid dir path: must be relative alphanumeric with slashes",
				},
				400,
			);
		}

		await next();
	},
);
