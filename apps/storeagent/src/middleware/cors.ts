import type { MiddlewareHandler } from "hono";

/**
 * Lightweight CORS middleware.
 *
 * Unlike `hono/cors`, this only sets headers and never clones the response
 * body. That keeps Bun's zero-copy sendfile path intact for file downloads,
 * which the built-in CORS middleware currently breaks for sliced `Blob`s.
 */
export function simpleCors(): MiddlewareHandler {
	return async (c, next) => {
		c.header("Access-Control-Allow-Origin", "*");
		c.header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
		c.header("Access-Control-Allow-Headers", "Content-Type, Range");
		c.header("Access-Control-Expose-Headers", "Content-Range");

		if (c.req.method === "OPTIONS") {
			return c.body(null, 204);
		}

		await next();
	};
}
