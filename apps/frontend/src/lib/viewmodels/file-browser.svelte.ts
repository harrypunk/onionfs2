import { listMount } from "$lib/datasource/mount-source";
import type { NodeInfoMg } from "$lib/managers/NodeInfoMg.svelte";
import type { FsEntry } from "$lib/types";

/** View-model for the file browser page. Reads node info from the injected
 * manager and fetches directory entries from the agent. */
export class FileBrowserViewModel {
	readonly nodeId: string;
	readonly mountName: string;
	readonly dir: string;
	readonly #nodeinfoManager: NodeInfoMg;

	entries = $state<FsEntry[]>([]);
	error = $state<string | null>(null);
	isLoading = $state(true);

	constructor(
		nodeId: string,
		mountName: string,
		dir: string,
		nodeInfoManager: NodeInfoMg,
	) {
		this.nodeId = nodeId;
		this.mountName = mountName;
		this.dir = dir;
		this.#nodeinfoManager = nodeInfoManager;
	}

	async load(): Promise<void> {
		this.isLoading = true;
		this.error = null;

		const agentInfo = this.#nodeinfoManager.getNodeById(this.nodeId);
		if (!agentInfo) {
			this.error = `Cant find agent ${this.nodeId}`;
			this.isLoading = false;
			return;
		}

		try {
			this.entries = await listMount(
				agentInfo.publicUrl,
				this.mountName,
				this.dir,
			);
		} catch (err) {
			this.error = err instanceof Error ? err.message : String(err);
		} finally {
			this.isLoading = false;
		}
	}
}
