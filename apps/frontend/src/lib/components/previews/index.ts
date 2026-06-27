import type { FileCategory } from "$lib/file-category";
import FallbackPreview from "./FallbackPreview.svelte";
import ImagePreview from "./ImagePreview.svelte";
import VideoPreview from "./VideoPreview.svelte";

export const previewComponents: Record<FileCategory, typeof ImagePreview> = {
	image: ImagePreview,
	video: VideoPreview,
	other: FallbackPreview,
};

export function getPreviewComponent(category: FileCategory) {
	return previewComponents[category];
}
