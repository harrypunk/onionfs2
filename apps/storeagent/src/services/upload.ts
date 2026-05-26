import { mkdir, readdir, rm } from "node:fs/promises";
import { dirname, join } from "node:path";
import { defer, Observable, throwError } from "rxjs";
import { map, switchMap } from "rxjs/operators";
import { FsError, FsErrorCode, wrapFsError } from "@/lib/fs-error";
import type { UploadSessionManager } from "@/services/upload-session";

/** Pipe a Web Stream into a file on disk using Bun's FileSink. */
function writeStream(
	targetPath: string,
	stream: ReadableStream<Uint8Array>,
): Observable<void> {
	return new Observable((subscriber) => {
		const writer = Bun.file(targetPath).writer();
		const reader = stream.getReader();

		/**
		 * Recursive async loop that pulls chunks from the Web Stream reader
		 * and writes them to Bun's FileSink writer.
		 *
		 * Each iteration is scheduled via Promise .then() so the recursion
		 * is asynchronous and won't overflow the call stack, even for
		 * very large files.
		 */
		const pump = (): void => {
			reader.read().then(
				({ done, value }) => {
					if (done) {
						// Stream exhausted — close writer and complete Observable.
						writer.end();
						subscriber.next();
						subscriber.complete();
						return;
					}
					// Write the chunk and schedule the next iteration.
					writer.write(value);
					pump();
				},
				(err) => {
					// Read failed — close writer and emit error.
					writer.end();
					subscriber.error(err);
				},
			);
		};

		// Kick off the first read.
		pump();
	});
}

/* ------------------------------------------------------------------ */
/*  Simple upload                                                      */
/* ------------------------------------------------------------------ */

/**
 * Write an entire stream to disk in one shot.
 *
 * Parent directories are created automatically.
 */
export function uploadFile(
	targetPath: string,
	source: ReadableStream<Uint8Array> | null,
): Observable<{ path: string; size: number }> {
	if (!source) {
		return throwError(
			() =>
				new FsError("Request body is required", FsErrorCode.InvalidArgument),
		);
	}

	return wrapFsError(
		defer(() => mkdir(dirname(targetPath), { recursive: true })).pipe(
			switchMap(() => writeStream(targetPath, source)),
			map(() => ({ path: targetPath, size: Bun.file(targetPath).size })),
		),
	);
}

/* ------------------------------------------------------------------ */
/*  Multipart upload                                                   */
/* ------------------------------------------------------------------ */

/**
 * Create a new multipart upload session.
 *
 * Returns an `uploadId` that the client must pass to subsequent
 * `/multipart/upload` and `/multipart/complete` calls.
 */
export function createMultipartSession(
	targetPath: string,
	manager: UploadSessionManager,
): Observable<string> {
	const uploadId = crypto.randomUUID();
	const tempDir = `${targetPath}-upload-${uploadId}`;

	return wrapFsError(
		defer(() => manager.save(uploadId, { targetPath, tempDir })).pipe(
			switchMap(() => mkdir(tempDir, { recursive: true })),
			map(() => uploadId),
		),
	);
}

/**
 * Write a single part (chunk) to the session's temporary folder.
 *
 * Parts are keyed by `partNumber` and later concatenated in numeric order.
 */
export function uploadPart(
	uploadId: string,
	partNumber: number,
	source: ReadableStream<Uint8Array> | null,
	manager: UploadSessionManager,
): Observable<void> {
	if (!source) {
		return throwError(
			() =>
				new FsError("Request body is required", FsErrorCode.InvalidArgument),
		);
	}
	if (partNumber < 1) {
		return throwError(
			() => new FsError("partNumber must be >= 1", FsErrorCode.InvalidArgument),
		);
	}

	return wrapFsError(
		defer(() => manager.get(uploadId)).pipe(
			switchMap((session) => {
				if (!session) {
					return throwError(
						() => new FsError("Upload session not found", FsErrorCode.NotFound),
					);
				}
				const chunkPath = join(session.tempDir, String(partNumber));
				return writeStream(chunkPath, source);
			}),
		),
	);
}

/**
 * Finalise a multipart upload.
 *
 * 1. Collect all part files from the session folder.
 * 2. Sort by part number.
 * 3. Concatenate into the final target path.
 * 4. Delete the temporary folder and session.
 */
export function completeMultipartUpload(
	uploadId: string,
	manager: UploadSessionManager,
): Observable<{ path: string; size: number }> {
	return wrapFsError(
		defer(() => manager.get(uploadId)).pipe(
			switchMap((session) => {
				if (!session) {
					return throwError(
						() => new FsError("Upload session not found", FsErrorCode.NotFound),
					);
				}
				return defer(() => readdir(session.tempDir)).pipe(
					map((entries) =>
						entries
							.filter((f) => /^\d+$/.test(f))
							.map((f) => ({
								num: Number(f),
								path: join(session.tempDir, f),
							}))
							.sort((a, b) => a.num - b.num),
					),
					switchMap((parts) =>
						defer(async () => {
							await mkdir(dirname(session.targetPath), {
								recursive: true,
							});
							const writer = Bun.file(session.targetPath).writer();
							for (const part of parts) {
								writer.write(await Bun.file(part.path).bytes());
							}
							writer.end();
						}),
					),
					switchMap(() =>
						defer(() => rm(session.tempDir, { recursive: true, force: true })),
					),
					switchMap(() =>
						defer(() => manager.delete(uploadId)).pipe(
							map(() => ({
								path: session.targetPath,
								size: Bun.file(session.targetPath).size,
							})),
						),
					),
				);
			}),
		),
	);
}
