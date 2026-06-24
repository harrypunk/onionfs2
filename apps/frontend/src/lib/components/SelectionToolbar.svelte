<script lang="ts">
	import Copy from "lucide-svelte/icons/copy";
	import Download from "lucide-svelte/icons/download";
	import FilePenLine from "lucide-svelte/icons/file-pen-line";
	import FolderOutput from "lucide-svelte/icons/folder-output";
	import Trash2 from "lucide-svelte/icons/trash-2";
	import X from "lucide-svelte/icons/x";
	import { FileAction } from "$lib/types";

	interface Props {
		selectedCount: number;
		onAction: (action: FileAction) => void;
		onClear: () => void;
	}

	let { selectedCount, onAction, onClear }: Props = $props();
</script>

<div class="selection-toolbar is-flex is-align-items-center">
	<span class="tag is-info is-light">{selectedCount} selected</span>

	<div class="buttons has-addons mb-0">
		<button
			class="button is-small"
			type="button"
			onclick={() => onAction(FileAction.Download)}
		>
			<span class="icon"><Download size={14} /></span>
			<span>Download</span>
		</button>
		<button
			class="button is-small"
			type="button"
			disabled={selectedCount !== 1}
			onclick={() => onAction(FileAction.Rename)}
		>
			<span class="icon"><FilePenLine size={14} /></span>
			<span>Rename</span>
		</button>
		<button
			class="button is-small"
			type="button"
			onclick={() => onAction(FileAction.Copy)}
		>
			<span class="icon"><Copy size={14} /></span>
			<span>Copy</span>
		</button>
		<button
			class="button is-small"
			type="button"
			onclick={() => onAction(FileAction.Move)}
		>
			<span class="icon"><FolderOutput size={14} /></span>
			<span>Move</span>
		</button>
	</div>

	<button
		class="button is-small is-danger is-outlined"
		type="button"
		onclick={() => onAction(FileAction.Delete)}
	>
		<span class="icon"><Trash2 size={14} /></span>
		<span>Delete</span>
	</button>

	<button
		class="button is-small"
		type="button"
		aria-label="Clear selection"
		onclick={onClear}
	>
		<span class="icon"><X size={14} /></span>
	</button>
</div>

<style>
	.selection-toolbar {
		flex-wrap: wrap;
		gap: 0.5rem;
	}
</style>
