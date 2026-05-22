import { Hono } from "hono";
import { from, lastValueFrom, throwError } from "rxjs";
import { catchError, shareReplay } from "rxjs/operators";
import { type AppConfig, loadConfig } from "./config";
import fsRoutes from "./routes/fs";

const config$ = from(loadConfig()).pipe(
	catchError((err) => {
		console.error("Failed to load config:", err);
		return throwError(() => err);
	}),
	shareReplay(1),
);

type Variables = {
	config: AppConfig;
};

const app = new Hono<{ Variables: Variables }>();

// Inject config into Hono context so routes can access it via c.get("config").
app.use(async (c, next) => {
	const cfg = await lastValueFrom(config$);
	c.set("config", cfg);
	await next();
});

app.get("/", (c) => c.text("Hello Hono!"));
app.route("/fs", fsRoutes);

export default app;
