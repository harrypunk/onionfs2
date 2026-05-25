import type { Stats } from "node:fs";
import { join } from "node:path";
import { forkJoin, type Observable, of, throwError } from "rxjs";
import { catchError, map, mergeMap } from "rxjs/operators";
import { FsError, FsErrorCode } from "@/lib/fs-error";
import type { ByteRange } from "@/lib/range";
import { fileStream, readDir, stat } from "@/repositories/fs";

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
 * List the contents of a directory and classify each entry as
 * file, directory, or unknown.
 *
 * The pipeline works as follows:
 * 1. Read the directory names from the repository.
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
	return readDir(path).pipe(
		mergeMap((entries) => {
			if (entries.length === 0) {
				return of({ path, entries: [] as DirEntry[] });
			}

			const entryObservables = entries.map((name) =>
				stat(join(path, name)).pipe(
					map(
						(s) =>
							({
								name,
								type: s.isDirectory() ? FileType.Directory : FileType.File,
								size: s.isDirectory() ? undefined : s.size,
							}) as DirEntry,
					),
					catchError(() => of({ name, type: 0 }) as Observable<DirEntry>),
				),
			);

			return forkJoin(entryObservables).pipe(
				map((results) => ({ path, entries: results })),
			);
		}),
	);
}

/** Business rule: reject if the path is not a regular file. */
function assertIsFile(stats: Stats): Stats {
	if (!stats.isFile()) {
		throw new FsError("Not a file", FsErrorCode.NotAFile);
	}
	return stats;
}

/** File stream with its total byte size. */
export interface FileStream {
	stream: ReadableStream;
	size: number;
}

/**
 * Open a file as a byte stream.
 *
 * Validates the path is a file, then delegates streaming to the repository.
 *
 * @param path   Absolute path to the file.
 * @param range  Optional byte range `{ start, end? }`.
 * @returns      Observable that emits once with the stream and metadata.
 */
export function getFileContent(
	path: string,
	range?: ByteRange,
): Observable<FileStream> {
	return stat(path).pipe(
		map(assertIsFile),
		map((stats) => {
			const start = range?.start ?? 0;
			const end = range?.end !== undefined ? range.end + 1 : undefined;
			return {
				stream: fileStream(path, start, end),
				size: stats.size,
			};
		}),
		catchError((err) => throwError(() => err)),
	);
}
