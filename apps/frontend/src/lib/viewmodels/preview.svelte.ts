import { fileNameFromPathId } from "$lib/url-helpers";
import { fileCategory } from "$lib/file-category";

export type PreviewCategory = ReturnType<typeof fileCategory>;

/** View-model for the preview page. Builds the direct agent URL from the
 * node's publicUrl and the encoded file id supplied by the route. */
export class PreviewViewModel {
	readonly mountName: string;
	readonly fileId: string;
	readonly nodePublicUrl: string;

	directUrl = $state<string | null>(null);
	error = $state<Error | null>(null);
	fileName = $state("");
	category = $derived(fileCategory(this.fileName));

	constructor(mountName: string, fileId: string, publicUrl: string) {
		this.mountName = mountName;
		this.fileId = fileId;
		this.nodePublicUrl = publicUrl;
	}

	private isValid(): boolean {
		return !!this.fileId && !!this.mountName && !!this.nodePublicUrl;
	}

	/** Decodes the file id and builds the direct agent URL.
	 * Only updates directUrl when all required values are present and valid. */
	updateFileUrl(): void {
		if (!this.isValid()) {
			return;
		}

		this.error = null;
		this.directUrl = null;

		const decoded = fileNameFromPathId(this.fileId);
		if (!decoded.ok) {
			this.error = new Error(decoded.error);
			return;
		}
		this.fileName = decoded.value;

		this.directUrl = `http://${this.nodePublicUrl}/file/${encodeURIComponent(this.mountName)}/${encodeURIComponent(this.fileId)}`;
	}
}
