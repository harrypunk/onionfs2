import { honoLogLayer } from "@loglayer/hono";
import { Hono } from "hono";
import { from, lastValueFrom, throwError } from "rxjs";
import { catchError, shareReplay, tap } from "rxjs/operators";
import { loadConfig } from "@/config";
import { log } from "@/logging";
import fsRoutes from "@/routes/fs";
import mountRoutes from "@/routes/mount";
import { InMemoryUploadSessionManager } from "@/services/upload-session";
import type { Variables } from "@/types";

const config$ = from(loadConfig()).pipe(
	tap((cfg) => {
		log.debug("Config loaded:", JSON.stringify(cfg, null, 2));
	}),
	catchError((err) => {
		log.withError(err).error("Failed to load config");
		return throwError(() => err);
	}),
	shareReplay(1),
);

const app = new Hono<{ Variables: Variables }>();

// Request-scoped logging via LogLayer + Pino.
app.use(honoLogLayer({ instance: log }));

// Inject config into Hono context so routes can access it via c.get("config").
app.use(async (c, next) => {
	const cfg = await lastValueFrom(config$);
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

export default app;
