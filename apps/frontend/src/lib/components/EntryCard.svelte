<script lang="ts">
	import { entryIcon } from "$lib/entry-helpers";
	import type { FsEntry } from "$lib/types";

	interface Props {
		entry: FsEntry;
		entryHref?: (name: string) => string;
	}

	let { entry, entryHref }: Props = $props();

	const Icon = $derived(entryIcon(entry.type));
	const href = $derived(entry.type === 1 ? entryHref?.(entry.name) : undefined);
</script>

{#if href}
	<a class="card entry-card" {href} title={entry.name}>
		<div class="card-content has-text-centered">
			<span class="icon is-large">
				<Icon size={64} />
			</span>
			<p class="title is-6 entry-name">{entry.name}</p>
		</div>
	</a>
{:else}
	<div class="card entry-card" title={entry.name}>
		<div class="card-content has-text-centered">
			<span class="icon is-large">
				<Icon size={64} />
			</span>
			<p class="title is-6 entry-name">{entry.name}</p>
		</div>
	</div>
{/if}

<style>
	.entry-card {
		transition:
			transform 0.1s ease,
			box-shadow 0.1s ease;
	}

	.entry-card:hover {
		transform: translateY(-2px);
		box-shadow: 0 0.5em 1em rgba(0, 0, 0, 0.1);
	}

	.entry-name {
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}
</style>
