import type { NodeDataSource } from "$lib/datasource/types";
import type { NodeInfo } from "$lib/types";

export class NodeState {
	#nodes = $state<NodeInfo[]>([]);
	#loading = $state(false);
	#error = $state<Error | null>(null);

	get nodes() {
		return this.#nodes;
	}

	set nodes(value: NodeInfo[]) {
		this.#nodes = value;
	}

	get loading() {
		return this.#loading;
	}

	get error() {
		return this.#error;
	}

	constructor(private source: NodeDataSource) {}

	load() {
		this.#loading = true;
		this.#error = null;

		this.source.fetch().subscribe({
			next: (nodes) => {
				this.#nodes = nodes;
			},
			error: (err) => {
				this.#error = err instanceof Error ? err : new Error(String(err));
				this.#loading = false;
			},
			complete: () => {
				this.#loading = false;
			},
		});
	}
}
