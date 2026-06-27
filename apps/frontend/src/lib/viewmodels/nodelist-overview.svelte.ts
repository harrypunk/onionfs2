import type { NodeInfoMg } from "$lib/managers/NodeInfoMg.svelte";

// Node list overview
export class NodelistVM {
	#infoMap;
	constructor(mg: NodeInfoMg) {
		this.#infoMap = $derived(mg.infoMap);
	}

	get infoMap() {
		return this.#infoMap;
	}
}
