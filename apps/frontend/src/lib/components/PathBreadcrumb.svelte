<script lang="ts" module>
	/** One segment of a breadcrumb trail. */
	export interface BreadcrumbItem {
		/** Display text for the segment. */
		label: string;
		/** Navigation target; omitted when the segment has nowhere to go. */
		href?: string;
	}
</script>

<script lang="ts">
	import Home from "lucide-svelte/icons/home";

	interface Props {
		/** Ordered list of breadcrumb segments to render. */
		items: BreadcrumbItem[];
	}

	let { items }: Props = $props();
</script>

<!-- Bulma breadcrumb navigation. Every segment with an href is clickable. -->
<nav class="breadcrumb" aria-label="breadcrumbs">
	<ul>
		{#each items as item, index (item.label)}
			<li>
				{#if index === 0 && item.href}
					<!-- Root/home segment: show a house icon plus its label. -->
					<a href={item.href} class="icon-text">
						<span class="icon">
							<Home size={16} />
						</span>
						<span>{item.label}</span>
					</a>
				{:else if item.href}
					<a href={item.href}>{item.label}</a>
				{:else}
					<span>{item.label}</span>
				{/if}
			</li>
		{/each}
	</ul>
</nav>

<style>
	/* Bulma only styles breadcrumb links by default; plain-text segments need
	   the same horizontal padding so separators feel evenly spaced. */
	.breadcrumb li > span {
		padding: 0 0.75em;
	}
</style>
