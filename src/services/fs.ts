import {
	createReadStream,
	readdir as readdirCb,
	type Stats,
	stat as statCb,
} from "node:fs";
import { join } from "node:path";
import type { Readable } from "node:stream";
import { forkJoin, Observable, of, throwError } from "rxjs";
import { catchError, map, mergeMap } from "rxjs/operators";

/** File-type bitmask enum. */
export enum FileType {
	Unknown = 0,
	Directory = 1 << 0,
	File = 1 << 1,
}

/** Metadata for a single file-system entry. */
export interface DirEntry {
	name: string;
	type: FileType;
	/** File size in bytes. Only present for {@link FileType.File} entries. */
	size?: number;
}

/**
 * Wrap Node's callback-based `readdir` as a cold Observable.
 * Emits the array of entry names and completes, or errors on failure.
 */
function readdir$(path: string): Observable<string[]> {
	return new Observable((subscriber) => {
		readdirCb(path, (err, files) => {
			if (err) {
				// Propagate fs errors (ENOENT, EACCES, etc.) downstream.
				subscriber.error(err);
			} else if (files !== undefined) {
				subscriber.next(files);
				subscriber.complete();
			} else {
				// Defensive: Node should never call back with undefined on success,
				// but we guard against it to avoid hanging the stream.
				subscriber.error(new Error("Unexpected undefined from readdir"));
			}
		});
	});
}

/**
 * Wrap Node's callback-based `stat` as a cold Observable.
 * Emits the Stats object and completes, or errors on failure.
 */
function stat$(path: string): Observable<Stats> {
	return new Observable((subscriber) => {
		statCb(path, (err, stats) => {
			if (err) {
				subscriber.error(err);
			} else if (stats !== undefined) {
				subscriber.next(stats);
				subscriber.complete();
			} else {
				subscriber.error(new Error("Unexpected undefined from stat"));
			}
		});
	});
}

/**
 * List the contents of a directory and classify each entry as
 * file, directory, or unknown.
 *
 * The pipeline works as follows:
 * 1. Read the directory names.
 * 2. For each name, stat it in parallel via forkJoin.
 * 3. Map stat results to DirEntry objects.
 * 4. If a single stat fails, catch locally so forkJoin does not abort
 *    the entire operation; the entry is marked "unknown".
 *
 * @param path - Target directory path.
 * @returns Observable that emits once and completes.
 */
export function listDir(
	path: string,
): Observable<{ path: string; entries: DirEntry[] }> {
	return readdir$(path).pipe(
		// Flatten the array of names into parallel stat requests.
		mergeMap((entries) => {
			if (entries.length === 0) {
				return of({ path, entries: [] as DirEntry[] });
			}

			// Build an Observable for each entry's stat + classification.
			const entryObservables = entries.map((name) =>
				stat$(join(path, name)).pipe(
					map(
						(s) =>
							({
								name,
								type: s.isDirectory() ? FileType.Directory : FileType.File,
								size: s.isDirectory() ? undefined : s.size,
							}) as DirEntry,
					),
					// Local error recovery: if stat fails (e.g. symlink broken),
					// emit "unknown" instead of killing the whole forkJoin.
					catchError(() => of({ name, type: 0 }) as Observable<DirEntry>),
				),
			);

			// Wait for all stats to finish, then bundle into the final shape.
			return forkJoin(entryObservables).pipe(
				map((results) => ({ path, entries: results })),
			);
		}),
	);
}

/** Byte range for partial content requests. */
export interface ByteRange {
	/** Inclusive start byte index. */
	start: number;
	/** Inclusive end byte index; omitted means read to EOF. */
	end?: number;
}

/** Result of opening a file for streaming. */
export interface FileContent {
	/** Node.js readable stream of the file (or range). */
	stream: Readable;
	/** Total file size in bytes. */
	size: number;
	/** Range that was requested, if any. */
	range?: ByteRange;
}

/**
 * Open a file as a byte stream.
 *
 * Uses `fs.createReadStream` under the hood so memory stays flat
 * regardless of file size.
 *
 * @param path   Absolute path to the file.
 * @param range  Optional byte range `{ start, end? }`.
 * @returns      Observable that emits once with the stream and metadata.
 */
function assertIsFile(stats: Stats): Stats {
	if (!stats.isFile()) {
		const err = new Error("Not a file");
		(err as NodeJS.ErrnoException).code = "EISDIR";
		throw err;
	}
	return stats;
}

export function getFileContent(
	path: string,
	range?: ByteRange,
): Observable<FileContent> {
	return stat$(path).pipe(
		map(assertIsFile),
		map((stats) => {
			const options = range
				? { start: range.start, end: range.end }
				: undefined;
			const stream = createReadStream(path, options);
			return { stream, size: stats.size, range };
		}),
		catchError((err) => throwError(() => err)),
	);
}
