import { type HonoLogLayerVariables, honoLogLayer } from "@loglayer/hono";
import { Hono } from "hono";
import { from, lastValueFrom, throwError } from "rxjs";
import { catchError, shareReplay } from "rxjs/operators";
import { type AppConfig, loadConfig } from "./config";
import { log } from "./logging";
import fsRoutes from "./routes/fs";

const config$ = from(loadConfig()).pipe(
	catchError((err) => {
		log.withError(err).error("Failed to load config");
		return throwError(() => err);
	}),
	shareReplay(1),
);

type Variables = {
	config: AppConfig;
} & HonoLogLayerVariables;

const app = new Hono<{ Variables: Variables }>();

// Request-scoped logging via LogLayer + Pino.
app.use(honoLogLayer({ instance: log }));

// Inject config into Hono context so routes can access it via c.get("config").
app.use(async (c, next) => {
	const cfg = await lastValueFrom(config$);
	c.set("config", cfg);
	await next();
});

app.get("/", (c) => c.text("Hello Hono!"));
app.route("/fs", fsRoutes);

export default app;
