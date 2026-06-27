<script lang="ts">
	import { entryIcon, formatSize, typeLabel } from "$lib/entry-helpers";
	import type { FileBrowserFsEntry } from "$lib/types";

	interface Props {
		entry: FileBrowserFsEntry;
		selected?: boolean;
		onToggle?: (selected: boolean) => void;
	}

	let { entry, selected = false, onToggle }: Props = $props();

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
			{#if entry.href}
				<a href={entry.href}>{entry.name}</a>
			{:else}
				<span>{entry.name}</span>
			{/if}
		</span>
	</td>
	<td>{typeLabel(entry.type)}</td>
	<td class="has-text-right">{formatSize(entry.size)}</td>
</tr>
