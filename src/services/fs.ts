import { readdir as readdirCb, type Stats, stat as statCb } from "node:fs";
import { join } from "node:path";
import { forkJoin, Observable, of } from "rxjs";
import { catchError, map, mergeMap } from "rxjs/operators";

export interface DirEntry {
	name: string;
	type: "file" | "directory" | "unknown";
}

function readdir$(path: string): Observable<string[]> {
	return new Observable((subscriber) => {
		readdirCb(path, (err, files) => {
			if (err) {
				subscriber.error(err);
			} else if (files !== undefined) {
				subscriber.next(files);
				subscriber.complete();
			} else {
				subscriber.error(new Error("Unexpected undefined from readdir"));
			}
		});
	});
}

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

export function listDir(
	path: string,
): Observable<{ path: string; entries: DirEntry[] }> {
	return readdir$(path).pipe(
		mergeMap((entries) => {
			if (entries.length === 0) {
				return of({ path, entries: [] as DirEntry[] });
			}
			const entryObservables = entries.map((name) =>
				stat$(join(path, name)).pipe(
					map(
						(s) =>
							({
								name,
								type: s.isDirectory() ? "directory" : "file",
							}) as DirEntry,
					),
					catchError(
						() => of({ name, type: "unknown" }) as Observable<DirEntry>,
					),
				),
			);
			return forkJoin(entryObservables).pipe(
				map((results) => ({ path, entries: results })),
			);
		}),
	);
}
