// Node list overview
import {
	nodeInfoManager,
	type NodeInfoMg,
} from "$lib/managers/NodeInfoMg.svelte";

export class NodelistVM {
	#infoMap;
	constructor(mg: NodeInfoMg) {
		this.#infoMap = $derived(mg.infoMap);
	}

	get infoMap() {
		return this.#infoMap;
	}
}

export const overviewVM = new NodelistVM(nodeInfoManager);
