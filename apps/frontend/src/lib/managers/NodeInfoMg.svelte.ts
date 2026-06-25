import {
	natsNodeDataSource,
	type NatsNodeDataSource,
} from "$lib/datasource/node-source.svelte";

export class NodeInfoMg {
	#infoMap;

	constructor(ds: NatsNodeDataSource) {
		this.#infoMap = $derived(ds.infoMap);
	}

	get infoMap() {
		return this.#infoMap;
	}

	getNodeById(id: string) {
		return this.#infoMap.get(id);
	}
}

export const nodeInfoManager = new NodeInfoMg(natsNodeDataSource);
