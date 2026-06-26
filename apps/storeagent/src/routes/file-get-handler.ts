import type { Context } from "hono";
import { firstValueFrom, of } from "rxjs";
import { catchError, map } from "rxjs/operators";
import type { AppConfig } from "@/config";
import { withReadConcurrency } from "@/lib/concurrency";
import { buildFileGetResponse } from "@/lib/file-response";
import { parseRangeHeader } from "@/lib/range";
import { fsGetErrorResponse } from "@/routes/fs-error-handler";
import { getFileContent } from "@/services/fs";
import type { FilePathVariables } from "@/types";

/** Default maximum bytes served for a single range request. */
const DEFAULT_RANGE_CHUNK = 8 * 1024 * 1024;

/**
 * Shared file-serving logic for `/fs/get` and `/file/:id`.
 *
 * Resolves range headers, applies the read-concurrency semaphore, builds the
 * response, and maps errors to HTTP responses.
 */
export function handleFileGet(
	c: Context<{ Variables: FilePathVariables }>,
	realPath: string,
	config: AppConfig,
): Promise<Response> {
	const signal = c.req.raw.signal;
	if (signal.aborted) {
		return Promise.resolve(new Response(null, { status: 499 }));
	}

	const range = parseRangeHeader(c.req.header("range"));
	const maxChunk = config.range_chunk_size ?? DEFAULT_RANGE_CHUNK;
	const effectiveRange = range
		? {
				start: range.start,
				end:
					range.end !== undefined
						? Math.min(range.end, range.start + maxChunk - 1)
						: range.start + maxChunk - 1,
			}
		: undefined;

	return firstValueFrom(
		getFileContent(realPath, effectiveRange).pipe(
			withReadConcurrency(c.var.readSemaphore, signal),
			map(({ body, size }) =>
				buildFileGetResponse(realPath, effectiveRange, maxChunk, body, size),
			),
			catchError((err) =>
				of(fsGetErrorResponse(c, err, "Failed to read file")),
			),
		),
	);
}
