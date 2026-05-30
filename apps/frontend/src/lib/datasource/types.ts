import type { Observable } from "rxjs";
import type { NodeInfo } from "$lib/types";

export interface NodeDataSource {
	/** Returns an observable of the current node list. */
	fetch(): Observable<NodeInfo>;
}
