import { fileNameFromPathId } from "$lib/url-helpers";
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
	readonly fileId: string;

	directUrl = $state<string | null>(null);
	error = $state<Error | null>(null);
	fileName = $state("");
	category = $derived(fileCategory(this.fileName));

	constructor(nodeId: string, mountName: string, fileId: string) {
		this.nodeId = nodeId;
		this.mountName = mountName;
		this.fileId = fileId;
	}

	/** Triggers an immediate URL build attempt.
	 * Call from the component's $effect or onMount. */
	updateFileUrl(): void {
		this.error = null;

		const decoded = fileNameFromPathId(this.fileId);
		if (decoded.ok) {
			this.fileName = decoded.value;
		} else {
			this.error = new Error(decoded.error);
			return;
		}

		const node = nodeInfoManager.getNodeById(this.nodeId);
		if (node?.publicUrl) {
			this.#setUrl(node.publicUrl);
		}
	}

	#setUrl(publicUrl: string): void {
		this.directUrl = `http://${publicUrl}/file/${encodeURIComponent(this.mountName)}/${encodeURIComponent(this.fileId)}`;
	}
}
