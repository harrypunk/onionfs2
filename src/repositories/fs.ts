import { readdir as readdirCb, type Stats, stat as statCb } from "node:fs";
import { Observable } from "rxjs";
import { fromNodeError } from "@/lib/fs-error";

/**
 * Read the names of entries in a directory.
 *
 * Raw I/O — no business logic.
 */
export function readDir(path: string): Observable<string[]> {
	return new Observable((subscriber) => {
		readdirCb(path, (err, files) => {
			if (err) {
				subscriber.error(fromNodeError(err));
			} else if (files !== undefined) {
				subscriber.next(files);
				subscriber.complete();
			} else {
				subscriber.error(new Error("Unexpected undefined from readdir"));
			}
		});
	});
}

/**
 * Get filesystem metadata for a path.
 *
 * Raw I/O — no business logic.
 */
export function stat(path: string): Observable<Stats> {
	return new Observable((subscriber) => {
		statCb(path, (err, stats) => {
			if (err) {
				subscriber.error(fromNodeError(err));
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
 * Open a readable byte stream for a file.
 *
 * Raw I/O — no validation. The caller must ensure the path exists and is
 * a file before calling this.
 */
export function fileStream(
	path: string,
	start?: number,
	end?: number,
): ReadableStream {
	const file = Bun.file(path);
	return file.slice(start ?? 0, end).stream();
}
