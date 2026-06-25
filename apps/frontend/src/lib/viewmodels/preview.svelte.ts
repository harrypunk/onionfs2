import { fileCategory } from "$lib/file-category";
import { nodeInfoManager } from "$lib/managers/NodeInfoMg.svelte";

export type PreviewCategory = ReturnType<typeof fileCategory>;

/** View-model for the preview page. Builds the direct agent URL once load() is
 * called with the node's publicUrl available in nodeInfoManager.
 *
 * TODO: If a preview URL is opened directly before the NATS heartbeat arrives,
 * load() finds no node and the UI stays in "Loading…" forever. Re-add reactivity
 * (or a retry) here when we tackle that edge case. */
export class PreviewViewModel {
	readonly nodeId: string;
	readonly mountName: string;
	readonly filePath: string;

	directUrl = $state<string | null>(null);
	error = $state<Error | null>(null);
	isLoading = $state(true);

	constructor(nodeId: string, mountName: string, filePath: string) {
		this.nodeId = nodeId;
		this.mountName = mountName;
		this.filePath = filePath;
	}

	get fileName(): string {
		return this.filePath.split("/").pop() ?? "";
	}

	get category(): PreviewCategory {
		return fileCategory(this.fileName);
	}

	/** Triggers an immediate URL build attempt.
	 * Call from the component's $effect or onMount. */
	load(): void {
		this.isLoading = true;
		this.error = null;

		const node = nodeInfoManager.getNodeById(this.nodeId);
		if (node?.publicUrl) {
			this.#setUrl(node.publicUrl);
		}
	}

	#setUrl(publicUrl: string): void {
		const query = `mount=${encodeURIComponent(this.mountName)}&dir=${encodeURIComponent(this.filePath)}`;
		this.directUrl = `http://${publicUrl}/fs/get?${query}`;
		this.isLoading = false;
	}
}
