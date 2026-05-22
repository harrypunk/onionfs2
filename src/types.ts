import type { HonoLogLayerVariables } from "@loglayer/hono";
import type { AppConfig } from "./config";

/** Hono context variables shared across the app and sub-routers. */
export type Variables = {
	config: AppConfig;
} & HonoLogLayerVariables;
