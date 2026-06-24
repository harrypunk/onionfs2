<script lang="ts">
	import FileGrid from "$lib/components/FileGrid.svelte";
	import FileList from "$lib/components/FileList.svelte";
	import ViewToggle from "$lib/components/ViewToggle.svelte";
	import { SortKey, ViewMode, type FsEntry } from "$lib/types";

	interface Props {
		entries: FsEntry[];
		entryHref?: (name: string) => string;
	}

	let { entries, entryHref }: Props = $props();

	let sortKey = $state<SortKey>(SortKey.Name);
	let isAscending = $state<boolean>(true);
	let viewMode = $state<ViewMode>(ViewMode.List);

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
</script>

<div class="entry-table">
	<div class="is-flex is-justify-content-flex-end is-align-items-center mb-4">
		<ViewToggle value={viewMode} onChange={setViewMode} />
	</div>

	{#if viewMode === ViewMode.List}
		<FileList
			entries={sortedEntries()}
			{entryHref}
			{sortKey}
			{isAscending}
			onSort={toggleSort}
		/>
	{:else}
		<FileGrid
			entries={sortedEntries()}
			{entryHref}
			{sortKey}
			{isAscending}
			onSort={toggleSort}
		/>
	{/if}
</div>
