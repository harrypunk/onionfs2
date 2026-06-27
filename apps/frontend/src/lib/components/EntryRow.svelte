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
	<td class="p-0">
		<a href={entry.href} class="is-block px-4 py-3">
			<span class="icon-text">
				<span class="icon">
					<Icon size={16} />
				</span>
				<span>{entry.name}</span>
			</span>
		</a>
	</td>
	<td>{typeLabel(entry.type)}</td>
	<td class="has-text-right">{formatSize(entry.size)}</td>
</tr>
