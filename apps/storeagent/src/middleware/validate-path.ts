import { createMiddleware } from "hono/factory";
import { validateRelativePath } from "@/lib/filepath-validate";
import { log } from "@/logging";
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
		const relativePath = c.req.query("file") ?? c.req.query("dir") ?? "";

		if (!mount || !/^[a-zA-Z0-9]+$/.test(mount)) {
			log.warn(
				`Invalid mount name in ${c.req.method} ${c.req.url}: mount=${mount}`,
			);
			return c.json({ error: "Invalid mount name" }, 400);
		}

		const pathError = validateRelativePath(relativePath);
		if (pathError) {
			log.warn(
				`Invalid path in ${c.req.method} ${c.req.url}: path=${relativePath} reason=${pathError}`,
			);
			return c.json({ error: `Invalid path: ${pathError}` }, 400);
		}

		await next();
	},
);
