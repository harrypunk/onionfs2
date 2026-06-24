<script lang="ts">
	import EntryRow from "$lib/components/EntryRow.svelte";
	import EntryTableHeader from "$lib/components/EntryTableHeader.svelte";
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

<table class="table is-fullwidth is-striped is-hoverable">
	<thead>
		<tr>
			<EntryTableHeader
				label="Name"
				active={sortKey === SortKey.Name}
				isAscending={sortKey === SortKey.Name ? isAscending : undefined}
				onSort={() => onSort(SortKey.Name)}
			/>
			<EntryTableHeader
				label="Type"
				active={sortKey === SortKey.Type}
				isAscending={sortKey === SortKey.Type ? isAscending : undefined}
				onSort={() => onSort(SortKey.Type)}
			/>
			<EntryTableHeader
				label="Size"
				align="right"
				active={sortKey === SortKey.Size}
				isAscending={sortKey === SortKey.Size ? isAscending : undefined}
				onSort={() => onSort(SortKey.Size)}
			/>
		</tr>
	</thead>
	<tbody>
		{#each entries as entry (entry.name)}
			<EntryRow {entry} {entryHref} />
		{/each}
	</tbody>
</table>
