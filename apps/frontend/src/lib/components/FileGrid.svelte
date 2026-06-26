<script lang="ts">
	import EntryCard from "$lib/components/EntryCard.svelte";
	import SortBar from "$lib/components/SortBar.svelte";
	import { SortKey, type FsEntry } from "$lib/types";

	interface Props {
		entries: FsEntry[];
		entryHref?: (name: string) => string;
		fileHref?: (entry: FsEntry) => string;
		sortKey: SortKey;
		isAscending: boolean;
		onSort: (key: SortKey) => void;
		selected: Set<string>;
		onToggle: (name: string, selected: boolean) => void;
		onSelectAll: (selected: boolean) => void;
	}

	let {
		entries,
		entryHref,
		fileHref,
		sortKey,
		isAscending,
		onSort,
		selected,
		onToggle,
		onSelectAll,
	}: Props = $props();

	const allSelected = $derived(
		entries.length > 0 && entries.every((entry) => selected.has(entry.name)),
	);
</script>

<div class="file-grid-view">
	<div class="is-flex is-align-items-center mb-4">
		<label class="checkbox mr-4">
			<input
				type="checkbox"
				checked={allSelected}
				indeterminate={!allSelected &&
					entries.some((entry) => selected.has(entry.name))}
				onchange={(event) => onSelectAll(event.currentTarget.checked)}
			/>
			Select all
		</label>
		<SortBar {sortKey} {isAscending} {onSort} />
	</div>
	<div class="file-grid" role="list">
		{#each entries as entry (entry.name)}
			<div role="listitem">
				<EntryCard
					{entry}
					{entryHref}
					{fileHref}
					selected={selected.has(entry.name)}
					onToggle={(checked) => onToggle(entry.name, checked)}
				/>
			</div>
		{/each}
	</div>
</div>

<style>
	.file-grid {
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(10rem, 1fr));
		gap: 1rem;
	}
</style>
