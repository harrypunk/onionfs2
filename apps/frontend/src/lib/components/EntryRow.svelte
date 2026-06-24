<script lang="ts">
	import { entryIcon, formatSize, typeName } from "$lib/entry-helpers";
	import type { FsEntry } from "$lib/types";

	interface Props {
		entry: FsEntry;
		entryHref?: (name: string) => string;
	}

	let { entry, entryHref }: Props = $props();

	const Icon = $derived(entryIcon(entry.type));
</script>

<tr>
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
	<td>{typeName(entry.type)}</td>
	<td class="has-text-right">{formatSize(entry.size)}</td>
</tr>
