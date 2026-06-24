<script lang="ts">
	import File from "lucide-svelte/icons/file";
	import FileQuestion from "lucide-svelte/icons/file-question";
	import Folder from "lucide-svelte/icons/folder";
	import type { FsEntry } from "$lib/types";

	interface Props {
		entry: FsEntry;
		entryHref?: (name: string) => string;
	}

	let { entry, entryHref }: Props = $props();

	const Icon = $derived(entryIcon(entry.type));

	function typeName(type: number): string {
		switch (type) {
			case 1:
				return "Directory";
			case 2:
				return "File";
			default:
				return "Unknown";
		}
	}

	function entryIcon(type: number) {
		switch (type) {
			case 1:
				return Folder;
			case 2:
				return File;
			default:
				return FileQuestion;
		}
	}

	function formatSize(bytes: number | undefined): string {
		if (bytes === undefined) return "-";
		if (bytes < 1024) return `${bytes} B`;
		if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(2)} KB`;
		if (bytes < 1024 * 1024 * 1024)
			return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
		return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`;
	}
</script>

<tr>
	<td>
		<span class="icon-text">
			<span class="icon">
				<Icon size={16} />
			</span>
			{#if entry.type === 1 && entryHref}
				<a href={entryHref(entry.name)}>{entry.name}</a>
			{:else}
				<span>{entry.name}</span>
			{/if}
		</span>
	</td>
	<td>{typeName(entry.type)}</td>
	<td class="has-text-right">{formatSize(entry.size)}</td>
</tr>
