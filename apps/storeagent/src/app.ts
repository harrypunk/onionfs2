import { honoLogLayer } from "@loglayer/hono";
import { Hono } from "hono";

import type { AppConfig } from "@/config";
import { log } from "@/logging";
import fsRoutes from "@/routes/fs";
import mountRoutes from "@/routes/mount";
import { InMemoryUploadSessionManager } from "@/services/upload-session";
import type { Variables } from "@/types";

export function createApp(cfg: AppConfig) {
	const app = new Hono<{ Variables: Variables }>();

	// Request-scoped logging via LogLayer + Pino.
	app.use(honoLogLayer({ instance: log }));

	// Inject config into Hono context so routes can access it via c.get("config").
	app.use(async (c, next) => {
		c.set("config", cfg);
		await next();
	});

	// Shared upload session manager (singleton). Routes retrieve it via c.get("uploadSessionManager").
	const uploadSessionManager = new InMemoryUploadSessionManager();
	app.use(async (c, next) => {
		c.set("uploadSessionManager", uploadSessionManager);
		await next();
	});

	app.get("/", (c) => c.text("Hello Hono!"));
	app.route("/fs", fsRoutes);
	app.route("/mount", mountRoutes);

	return app;
}
