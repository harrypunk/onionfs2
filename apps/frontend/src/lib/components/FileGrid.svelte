<script lang="ts">
	import EntryCard from "$lib/components/EntryCard.svelte";
	import SortBar from "$lib/components/SortBar.svelte";
	import { SortKey, type FsEntry } from "$lib/types";

	interface Props {
		entries: FsEntry[];
		entryHref?: (name: string) => string;
		sortKey: SortKey;
		isAscending: boolean;
		onSort: (key: SortKey) => void;
	}

	let { entries, entryHref, sortKey, isAscending, onSort }: Props = $props();
</script>

<div class="file-grid-view">
	<SortBar {sortKey} {isAscending} {onSort} />
	<div class="file-grid" role="list">
		{#each entries as entry (entry.name)}
			<div role="listitem">
				<EntryCard {entry} {entryHref} />
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
