import { SvelteMap } from "svelte/reactivity";
import type { NodeDataSource } from "$lib/datasource/types";
import type { NodeInfo } from "$lib/types";

export class NodeState {
	#nodes = $state(new SvelteMap<string, NodeInfo>());
	#error = $state<Error | null>(null);

	get nodes() {
		return this.#nodes;
	}

	get error() {
		return this.#error;
	}

	constructor(private source: NodeDataSource) {}

	load() {
		this.#error = null;

		this.source.fetch().subscribe({
			next: (node) => {
				this.#nodes.set(node.id, node);
			},
			error: (err) => {
				this.#error = err instanceof Error ? err : new Error(String(err));
			},
		});
	}
}
