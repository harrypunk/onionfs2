import { readdir as readdirCb, type Stats, stat as statCb } from "node:fs";
import { readdir } from "node:fs/promises";
import { join } from "node:path";
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
 * Open a sliced file blob for reading.
 *
 * Returns the native Bun file slice instead of a ReadableStream so that
 * `new Response()` can use Bun's zero-copy sendfile path. The caller must
 * ensure the path exists and is a file before calling this.
 */
export function fileBlob(path: string, start?: number, end?: number): Blob {
	const file = Bun.file(path);
	return file.slice(start ?? 0, end);
}

/**
 * Recursively list all regular files under a directory.
 *
 * Returns absolute paths. Directories are traversed; non-file entries are
 * ignored.
 */
export function walkFiles(path: string): Observable<string[]> {
	return new Observable((subscriber) => {
		const files: string[] = [];

		const walk = async (dir: string): Promise<void> => {
			const entries = await readdir(dir, { withFileTypes: true });
			for (const entry of entries) {
				const fullPath = join(dir, entry.name);
				if (entry.isDirectory()) {
					await walk(fullPath);
				} else if (entry.isFile()) {
					files.push(fullPath);
				}
			}
		};

		walk(path).then(
			() => {
				subscriber.next(files);
				subscriber.complete();
			},
			(err) => subscriber.error(fromNodeError(err)),
		);
	});
}
