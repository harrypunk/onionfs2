import { createMiddleware } from "hono/factory";
import type { Variables } from "../types";

/**
 * Validates that `mount` and `file` query params conform to expected formats.
 *
 * - mount: alphanumeric only
 * - file: alphanumeric characters with slashes (no leading slash, no traversal)
 *
 * Returns 400 early if either param is malformed.
 */
export const validatePath = createMiddleware<{ Variables: Variables }>(
	async (c, next) => {
		const mount = c.req.query("mount");
		const file = c.req.query("file");

		if (!mount || !/^[a-zA-Z0-9]+$/.test(mount)) {
			return c.json({ error: "Invalid mount name" }, 400);
		}

		if (!file || file.startsWith("/") || !/^[a-zA-Z0-9/]+$/.test(file)) {
			return c.json(
				{
					error:
						"Invalid file path: must be relative alphanumeric with slashes",
				},
				400,
			);
		}

		await next();
	},
);
