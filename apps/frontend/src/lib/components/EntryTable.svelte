<script lang="ts">
	import { SvelteSet } from "svelte/reactivity";
	import FileGrid from "$lib/components/FileGrid.svelte";
	import FileList from "$lib/components/FileList.svelte";
	import SelectionToolbar from "$lib/components/SelectionToolbar.svelte";
	import ViewToggle from "$lib/components/ViewToggle.svelte";
	import { FileAction, SortKey, ViewMode, type FsEntry } from "$lib/types";

	interface Props {
		entries: FsEntry[];
		entryHref?: (name: string) => string;
		fileHref?: (entry: FsEntry) => string;
		onAction?: (action: FileAction, entries: FsEntry[]) => void;
	}

	let { entries, entryHref, fileHref, onAction }: Props = $props();

	let sortKey = $state<SortKey>(SortKey.Name);
	let isAscending = $state<boolean>(true);
	let viewMode = $state<ViewMode>(ViewMode.List);
	let selectedNames = new SvelteSet<string>();

	const sortedEntries = $derived(() => {
		const sorted = [...entries];
		sorted.sort((a, b) => {
			let comparison = 0;
			switch (sortKey) {
				case SortKey.Name:
					comparison = a.name.localeCompare(b.name);
					break;
				case SortKey.Type:
					comparison = a.type - b.type;
					break;
				case SortKey.Size:
					comparison = (a.size ?? 0) - (b.size ?? 0);
					break;
			}
			return isAscending ? comparison : -comparison;
		});
		return sorted;
	});

	const selectedEntries = $derived(() =>
		sortedEntries().filter((entry) => selectedNames.has(entry.name)),
	);

	const hasSelection = $derived(selectedNames.size > 0);

	function toggleSort(key: SortKey) {
		if (sortKey === key) {
			isAscending = !isAscending;
		} else {
			sortKey = key;
			isAscending = true;
		}
	}

	function setViewMode(mode: ViewMode) {
		viewMode = mode;
	}

	function toggleSelection(name: string, selected: boolean) {
		if (selected) {
			selectedNames.add(name);
		} else {
			selectedNames.delete(name);
		}
	}

	function selectAll(selected: boolean) {
		if (selected) {
			for (const entry of sortedEntries()) {
				selectedNames.add(entry.name);
			}
		} else {
			selectedNames.clear();
		}
	}

	function clearSelection() {
		selectedNames.clear();
	}

	function handleAction(action: FileAction) {
		onAction?.(action, selectedEntries());
	}
</script>

<div class="entry-table">
	<div class="entry-table-controls mb-4">
		{#if hasSelection}
			<SelectionToolbar
				selectedCount={selectedNames.size}
				onAction={handleAction}
				onClear={clearSelection}
			/>
		{/if}
		<div class="view-toggle-wrapper">
			<ViewToggle value={viewMode} onChange={setViewMode} />
		</div>
	</div>

	{#if viewMode === ViewMode.List}
		<FileList
			entries={sortedEntries()}
			{entryHref}
			{fileHref}
			{sortKey}
			{isAscending}
			onSort={toggleSort}
			selected={selectedNames}
			onToggle={toggleSelection}
			onSelectAll={selectAll}
		/>
	{:else}
		<FileGrid
			entries={sortedEntries()}
			{entryHref}
			{fileHref}
			{sortKey}
			{isAscending}
			onSort={toggleSort}
			selected={selectedNames}
			onToggle={toggleSelection}
			onSelectAll={selectAll}
		/>
	{/if}
</div>

<style>
	.entry-table-controls {
		display: flex;
		justify-content: space-between;
		align-items: flex-start;
		gap: 0.5rem;
	}

	.view-toggle-wrapper {
		display: flex;
		margin-left: auto;
	}

	@media (max-width: 768px) {
		.entry-table-controls {
			flex-direction: column;
			align-items: stretch;
		}

		.view-toggle-wrapper {
			margin-left: 0;
		}

		.view-toggle-wrapper :global(.buttons) {
			width: 100%;
		}

		.view-toggle-wrapper :global(.buttons button) {
			flex: 1 1 50%;
		}
	}
</style>
