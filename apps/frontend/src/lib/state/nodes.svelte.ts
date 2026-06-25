import { SvelteMap } from "svelte/reactivity";
import type { Subscription } from "rxjs";
import { natsUrl } from "$lib/config";
import { NatsNodeDataSource } from "$lib/datasource/node-source";
import type { MountInfo, NodeInfo } from "$lib/types";

/** Reactive node info. Mutating fields in place lets heartbeats update lastSeen
 * without re-triggering effects that only depend on publicUrl or mounts. */
export class ReactiveNodeInfo implements NodeInfo {
	id: string;
	publicUrl = $state("");
	lastSeen = $state(0);
	mounts = $state<MountInfo[]>([]);

	constructor(node: NodeInfo) {
		this.id = node.id;
		this.publicUrl = node.publicUrl;
		this.lastSeen = node.lastSeen;
		this.mounts = node.mounts;
	}

	update(node: NodeInfo) {
		this.publicUrl = node.publicUrl;
		this.lastSeen = node.lastSeen;
		this.mounts = node.mounts;
	}
}

export class NodeState {
	#nodes = $state(new SvelteMap<string, ReactiveNodeInfo>());
	#error = $state<Error | null>(null);
	#subscription?: Subscription;

	get nodes() {
		return this.#nodes;
	}

	get error() {
		return this.#error;
	}

	constructor(private source: NatsNodeDataSource) {}

	load() {
		if (this.#subscription) return;

		this.#error = null;
		this.#subscription = this.source.fetch().subscribe({
			next: (node) => {
				const existing = this.#nodes.get(node.id);
				if (existing) {
					existing.update(node);
				} else {
					this.#nodes.set(node.id, new ReactiveNodeInfo(node));
				}
			},
			error: (err) => {
				this.#error = err instanceof Error ? err : new Error(String(err));
			},
		});
	}
}

/** Shared node state. Only one NATS consumer is created even if many pages read from it. */
export const nodeState = new NodeState(new NatsNodeDataSource(natsUrl));
