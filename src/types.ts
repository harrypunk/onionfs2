import type { HonoLogLayerVariables } from "@loglayer/hono";
import type { AppConfig } from "@/config";
import type { UploadSessionManager } from "@/services/upload-session";

/** Hono context variables shared across the app and sub-routers. */
export type Variables = {
	config: AppConfig;
	uploadSessionManager: UploadSessionManager;
} & HonoLogLayerVariables;
