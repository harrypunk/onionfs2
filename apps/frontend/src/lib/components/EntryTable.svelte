<script lang="ts">
	import EntryRow from "$lib/components/EntryRow.svelte";
	import EntryTableHeader from "$lib/components/EntryTableHeader.svelte";
	import { SortKey, type FsEntry } from "$lib/types";

	interface Props {
		entries: FsEntry[];
		entryHref?: (name: string) => string;
	}

	let { entries, entryHref }: Props = $props();

	let sortKey = $state<SortKey>(SortKey.Name);
	let isAscending = $state<boolean>(true);

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
</script>

<table class="table is-fullwidth is-striped is-hoverable">
	<thead>
		<tr>
			<EntryTableHeader
				label="Name"
				active={sortKey === SortKey.Name}
				isAscending={sortKey === SortKey.Name ? isAscending : undefined}
				onSort={() => toggleSort(SortKey.Name)}
			/>
			<EntryTableHeader
				label="Type"
				active={sortKey === SortKey.Type}
				isAscending={sortKey === SortKey.Type ? isAscending : undefined}
				onSort={() => toggleSort(SortKey.Type)}
			/>
			<EntryTableHeader
				label="Size"
				align="right"
				active={sortKey === SortKey.Size}
				isAscending={sortKey === SortKey.Size ? isAscending : undefined}
				onSort={() => toggleSort(SortKey.Size)}
			/>
		</tr>
	</thead>
	<tbody>
		{#each sortedEntries() as entry (entry.name)}
			<EntryRow {entry} {entryHref} />
		{/each}
	</tbody>
</table>
