import { fileCategory } from "$lib/file-category";
import { nodeState } from "$lib/state/nodes.svelte";

export type PreviewCategory = ReturnType<typeof fileCategory>;

/** View-model for the preview page. Encapsulates node lookup and URL building
 * so the Svelte component does not depend directly on nodeState or derived state. */
export class PreviewViewModel {
	readonly nodeId: string;
	readonly mountName: string;
	readonly filePath: string;

	directUrl = $state<string | null>(null);
	error = $state<Error | null>(null);
	isLoading = $state(true);

	#lastPublicUrl?: string;

	constructor(nodeId: string, mountName: string, filePath: string) {
		this.nodeId = nodeId;
		this.mountName = mountName;
		this.filePath = filePath;

		$effect(() => {
			const nodeError = nodeState.error;
			if (nodeError) {
				this.error = nodeError;
				this.isLoading = false;
			}
		});

		$effect(() => {
			const node = nodeState.nodes.get(this.nodeId);
			const publicUrl = node?.publicUrl;
			if (publicUrl && publicUrl !== this.#lastPublicUrl) {
				this.#lastPublicUrl = publicUrl;
				this.#setUrl(publicUrl);
			}
		});
	}

	get fileName(): string {
		return this.filePath.split("/").pop() ?? "";
	}

	get category(): PreviewCategory {
		return fileCategory(this.fileName);
	}

	/** Starts node discovery and builds the direct agent URL once the node is known.
	 * Call from the component's onMount lifecycle hook. */
	load(): void {
		this.isLoading = true;
		this.error = null;
		nodeState.load();

		const node = nodeState.nodes.get(this.nodeId);
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
