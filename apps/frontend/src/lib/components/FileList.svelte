<script lang="ts">
	import EntryRow from "$lib/components/EntryRow.svelte";
	import EntryTableHeader from "$lib/components/EntryTableHeader.svelte";
	import { SortKey, type FileBrowserFsEntry } from "$lib/types";

	interface Props {
		entries: FileBrowserFsEntry[];
		sortKey: SortKey;
		isAscending: boolean;
		onSort: (key: SortKey) => void;
		selected: Set<string>;
		onToggle: (name: string, selected: boolean) => void;
		onSelectAll: (selected: boolean) => void;
	}

	let {
		entries,
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

<table class="table is-fullwidth is-striped is-hoverable">
	<thead>
		<tr>
			<th class="is-narrow">
				<input
					type="checkbox"
					checked={allSelected}
					indeterminate={!allSelected &&
						entries.some((entry) => selected.has(entry.name))}
					onchange={(event) => onSelectAll(event.currentTarget.checked)}
					aria-label="Select all entries"
				/>
			</th>
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
			<EntryRow
				{entry}
				selected={selected.has(entry.name)}
				onToggle={(checked) => onToggle(entry.name, checked)}
			/>
		{/each}
	</tbody>
</table>
