import { honoLogLayer } from "@loglayer/hono";
import { Hono } from "hono";

import type { AppConfig } from "@/config";
import { Semaphore } from "@/lib/semaphore";
import { log } from "@/logging";
import { simpleCors } from "@/middleware/cors";
import fileRoutes from "@/routes/file";
import fsRoutes from "@/routes/fs";
import mountRoutes from "@/routes/mount";
import { FileIndex } from "@/services/file-index";
import { InMemoryUploadSessionManager } from "@/services/upload-session";
import type { Variables } from "@/types";

export async function createApp(cfg: AppConfig) {
	const app = new Hono<{ Variables: Variables }>();

	// Allow browser clients on the home LAN to call the agent API.
	app.use(simpleCors());

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

	// Global read concurrency limit for `/fs/get`.
	const readSemaphore = new Semaphore(cfg.max_concurrent_reads ?? 4);
	app.use(async (c, next) => {
		c.set("readSemaphore", readSemaphore);
		await next();
	});

	// Reversible id -> path resolver for `/file/:mount/:id` URLs.
	const fileIndex = new FileIndex(cfg.mounts);
	app.use(async (c, next) => {
		c.set("fileIndex", fileIndex);
		await next();
	});

	app.get("/", (c) => c.text("Hello Hono!"));
	app.route("/fs", fsRoutes);
	app.route("/file", fileRoutes);
	app.route("/mount", mountRoutes);

	return app;
}
