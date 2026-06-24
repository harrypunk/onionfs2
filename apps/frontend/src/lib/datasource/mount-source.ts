import { fromFetch } from "rxjs/fetch";
import { map } from "rxjs/operators";
import type { Observable } from "rxjs";

export interface FsEntry {
	name: string;
	type: number;
	size?: number;
}

/**
 * Lists the root directory of a node's mount.
 *
 * Returns an Observable so it can later be swapped for a live pub/sub source
 * (e.g. WebSocket or SSE) without changing the consumer.
 */
export function listMount(
	publicUrl: string,
	mountName: string,
): Observable<FsEntry[]> {
	return fromFetch(
		`http://${publicUrl}/fs/list?mount=${encodeURIComponent(mountName)}&dir=`,
		{
			selector: async (response) => {
				if (!response.ok) {
					return response.text().then((text) => {
						throw new Error(`HTTP ${response.status}: ${text}`);
					});
				}
				return response.json();
			},
		},
	).pipe(map((data) => data.entries ?? []));
}
