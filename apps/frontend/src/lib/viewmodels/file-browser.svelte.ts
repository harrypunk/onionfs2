import { listMount } from "$lib/datasource/mount-source";
import { UrlHelper } from "$lib/url-helpers";
import type { FileBrowserFsEntry, FsEntry } from "$lib/types";

/** View-model for the file browser page. Reads node info from the injected
 * manager and fetches directory entries from the agent. */
export class FileBrowserViewModel {
	readonly nodeId: string;
	readonly mountName: string;
	readonly filePath: string;
	readonly publicUrl: string;
	readonly urlHelper: UrlHelper;

	entries = $state<FsEntry[]>([]);
	error = $state<string | null>(null);
	isLoading = $state(true);

	/** Entries enriched with navigation URLs.
	 *
	 * The view-model owns URL generation so the UI can render a plain list of
	 * objects without knowing how paths are encoded or which route to target. */
	uiEntries: FileBrowserFsEntry[] = $derived(
		this.entries.map((entry) => ({
			...entry,
			href: this.#buildHref(entry),
		})),
	);

	constructor(
		nodeId: string,
		mountName: string,
		filePath: string,
		publicUrl: string,
		urlHelper: UrlHelper,
	) {
		this.nodeId = nodeId;
		this.mountName = mountName;
		this.filePath = filePath;
		this.publicUrl = publicUrl;
		this.urlHelper = urlHelper;
	}

	/** Build the URL the user follows when clicking an entry.
	 *
	 * `this.filePath` is the directory currently shown (decoded from the URL id).
	 * `nextFilePath` is the full path from the mount root to the clicked entry,
	 * e.g. current "photos" + entry "cat.jpg" → "photos/cat.jpg".
	 *
	 * Entry type 1 is a directory (folder); everything else is treated as a file
	 * that can be previewed. */
	#buildHref(entry: FsEntry): string {
		const nextFilePath = this.filePath
			? `${this.filePath}/${entry.name}`
			: entry.name;
		if (entry.type === 1) {
			return this.urlHelper.buildBrowseUrl(
				this.nodeId,
				this.mountName,
				nextFilePath,
			);
		}
		return this.urlHelper.buildPreviewUrl(
			this.nodeId,
			this.mountName,
			nextFilePath,
		);
	}

	private isValid(): boolean {
		return !!this.mountName && !!this.publicUrl;
	}

	async load(): Promise<void> {
		if (!this.isValid()) {
			return;
		}

		this.isLoading = true;
		this.error = null;

		try {
			this.entries = await listMount(
				this.publicUrl,
				this.mountName,
				this.filePath,
			);
		} catch (err) {
			this.error = err instanceof Error ? err.message : String(err);
		} finally {
			this.isLoading = false;
		}
	}
}
