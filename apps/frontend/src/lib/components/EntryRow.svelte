<script lang="ts">
	import { entryIcon, formatSize, typeLabel } from "$lib/entry-helpers";
	import type { FsEntry } from "$lib/types";

	interface Props {
		entry: FsEntry;
		entryHref?: (name: string) => string;
		selected?: boolean;
		onToggle?: (selected: boolean) => void;
	}

	let { entry, entryHref, selected = false, onToggle }: Props = $props();

	const Icon = $derived(entryIcon(entry.type));
</script>

<tr class:is-selected={selected}>
	<td class="is-narrow">
		<input
			type="checkbox"
			checked={selected}
			onchange={(event) => onToggle?.(event.currentTarget.checked)}
			aria-label="Select {entry.name}"
		/>
	</td>
	<td>
		<span class="icon-text">
			<span class="icon">
				<Icon size={16} />
			</span>
			{#if entry.type === 1 && entryHref}
				<a href={entryHref(entry.name)}>{entry.name}</a>
			{:else}
				<span>{entry.name}</span>
			{/if}
		</span>
	</td>
	<td>{typeLabel(entry.type)}</td>
	<td class="has-text-right">{formatSize(entry.size)}</td>
</tr>
