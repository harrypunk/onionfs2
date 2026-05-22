import { Hono } from "hono";
import type { Variables } from "@/types";

/** Hono sub-router for mount-management endpoints under `/mount`. */
const mountRoutes = new Hono<{ Variables: Variables }>();

/**
 * GET /mount/list
 *
 * Returns the list of configured mount names.
 */
mountRoutes.get("/list", (c) => {
	const cfg = c.get("config");
	return c.json({ mounts: Object.keys(cfg.mounts) });
});

export default mountRoutes;
