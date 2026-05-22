import { createMiddleware } from "hono/factory";
import { validateRelativePath } from "@/lib/filepath-validate";
import type { Variables } from "@/types";

/**
 * Validates that `mount` and `dir` query params conform to expected formats.
 *
 * - mount: alphanumeric only
 * - dir: relative path where each segment starts with a letter and may contain
 *        alphanumeric characters, dots, hyphens, and underscores.
 *        Empty string is allowed (mount root). Leading slash is forbidden.
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

		const dirError = validateRelativePath(dir);
		if (dirError) {
			return c.json({ error: `Invalid dir path: ${dirError}` }, 400);
		}

		await next();
	},
);
