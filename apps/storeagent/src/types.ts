import type { HonoLogLayerVariables } from "@loglayer/hono";
import type { AppConfig } from "@/config";
import type { Semaphore } from "@/lib/semaphore";
import type { FileIndex } from "@/services/file-index";
import type { UploadSessionManager } from "@/services/upload-session";

/** Hono context variables shared across the app and sub-routers. */
export type Variables = {
	config: AppConfig;
	uploadSessionManager: UploadSessionManager;
	readSemaphore: Semaphore;
	fileIndex: FileIndex;
} & HonoLogLayerVariables;

/** Variables available after a path/id resolving middleware has run. */
export type FilePathVariables = Variables & {
	mount: string;
	relativePath: string;
	realPath: string;
};
