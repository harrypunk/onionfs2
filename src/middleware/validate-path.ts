import { createMiddleware } from "hono/factory";
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

		const segmentPattern = /^[a-zA-Z][a-zA-Z0-9._-]*$/;
		const validDir =
			dir === "" ||
			(new RegExp(
				`^${segmentPattern.source}(/${segmentPattern.source})*/?$`,
			).test(dir) &&
				!dir.startsWith("/"));

		if (!validDir) {
			return c.json(
				{
					error:
						"Invalid dir path: each segment must start with a letter and contain only alphanumeric chars, dots, hyphens, or underscores",
				},
				400,
			);
		}

		await next();
	},
);
