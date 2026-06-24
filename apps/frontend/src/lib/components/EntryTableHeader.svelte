<script lang="ts">
	import ArrowDown from "lucide-svelte/icons/arrow-down";
	import ArrowUp from "lucide-svelte/icons/arrow-up";

	interface Props {
		label: string;
		active?: boolean;
		isAscending?: boolean;
		align?: "left" | "right";
		onSort?: () => void;
	}

	let {
		label,
		active = false,
		isAscending = false,
		align = "left",
		onSort,
	}: Props = $props();
</script>

<th
	class={align === "right" ? "has-text-right" : ""}
	onclick={() => onSort?.()}
	role="columnheader"
	aria-sort={active ? (isAscending ? "ascending" : "descending") : "none"}
>
	<span
		class="icon-text"
		class:is-flex={align === "right"}
		class:is-justify-content-flex-end={align === "right"}
	>
		<span>{label}</span>
		{#if active}
			<span class="icon">
				{#if isAscending}
					<ArrowUp size={14} />
				{:else}
					<ArrowDown size={14} />
				{/if}
			</span>
		{/if}
	</span>
</th>

<style>
	th {
		cursor: pointer;
		user-select: none;
	}
</style>
