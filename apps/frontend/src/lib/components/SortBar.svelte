<script lang="ts">
	import ArrowDown from "lucide-svelte/icons/arrow-down";
	import ArrowUp from "lucide-svelte/icons/arrow-up";
	import { SortKey } from "$lib/types";

	interface Props {
		sortKey: SortKey;
		isAscending: boolean;
		onSort: (key: SortKey) => void;
	}

	let { sortKey, isAscending, onSort }: Props = $props();

	const labels: Record<SortKey, string> = {
		[SortKey.Name]: "Name",
		[SortKey.Type]: "Type",
		[SortKey.Size]: "Size",
	};
</script>

<div class="sort-bar buttons has-addons" role="group" aria-label="Sort by">
	{#each [SortKey.Name, SortKey.Type, SortKey.Size] as key (key)}
		<button
			class="button"
			class:is-primary={sortKey === key}
			onclick={() => onSort(key)}
			type="button"
		>
			<span>{labels[key]}</span>
			{#if sortKey === key}
				<span class="icon">
					{#if isAscending}
						<ArrowUp size={14} />
					{:else}
						<ArrowDown size={14} />
					{/if}
				</span>
			{/if}
		</button>
	{/each}
</div>
