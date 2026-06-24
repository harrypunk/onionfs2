<script lang="ts">
	import { entryIcon } from "$lib/entry-helpers";
	import type { FsEntry } from "$lib/types";

	interface Props {
		entry: FsEntry;
		entryHref?: (name: string) => string;
		selected?: boolean;
		onToggle?: (selected: boolean) => void;
	}

	let { entry, entryHref, selected = false, onToggle }: Props = $props();

	const Icon = $derived(entryIcon(entry.type));
	const href = $derived(entry.type === 1 ? entryHref?.(entry.name) : undefined);
</script>

<div class="card entry-card" class:is-selected={selected}>
	<label class="entry-select">
		<input
			type="checkbox"
			checked={selected}
			onchange={(event) => onToggle?.(event.currentTarget.checked)}
			aria-label="Select {entry.name}"
		/>
	</label>

	{#if href}
		<a class="card-content entry-content" {href} title={entry.name}>
			<span class="icon is-large">
				<Icon size={64} />
			</span>
			<p class="title is-6 entry-name">{entry.name}</p>
		</a>
	{:else}
		<div class="card-content entry-content" title={entry.name}>
			<span class="icon is-large">
				<Icon size={64} />
			</span>
			<p class="title is-6 entry-name">{entry.name}</p>
		</div>
	{/if}
</div>

<style>
	.entry-card {
		position: relative;
		transition:
			transform 0.1s ease,
			box-shadow 0.1s ease;
	}

	.entry-card:hover {
		transform: translateY(-2px);
		box-shadow: 0 0.5em 1em rgba(0, 0, 0, 0.1);
	}

	.entry-select {
		position: absolute;
		top: 0.5rem;
		left: 0.5rem;
		z-index: 1;
		cursor: pointer;
	}

	.entry-content {
		display: block;
		text-align: center;
		text-decoration: none;
		color: inherit;
	}

	.entry-name {
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}
</style>
