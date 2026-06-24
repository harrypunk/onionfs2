import File from "lucide-svelte/icons/file";
import FileQuestion from "lucide-svelte/icons/file-question";
import Folder from "lucide-svelte/icons/folder";
import type { Component } from "svelte";

export function typeName(type: number): string {
	switch (type) {
		case 1:
			return "Directory";
		case 2:
			return "File";
		default:
			return "Unknown";
	}
}

export function formatSize(bytes: number | undefined): string {
	if (bytes === undefined) return "-";
	if (bytes < 1024) return `${bytes} B`;
	if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(2)} KB`;
	if (bytes < 1024 * 1024 * 1024)
		return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
	return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`;
}

export function entryIcon(type: number): Component<{ size?: number }> {
	switch (type) {
		case 1:
			return Folder as unknown as Component<{ size?: number }>;
		case 2:
			return File as unknown as Component<{ size?: number }>;
		default:
			return FileQuestion as unknown as Component<{ size?: number }>;
	}
}
