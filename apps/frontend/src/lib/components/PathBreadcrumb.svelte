<script lang="ts" module>
	/** One segment of a breadcrumb trail. */
	export interface BreadcrumbItem {
		/** Display text for the segment. */
		label: string;
		/** Navigation target; omitted for the current page or non-clickable segments. */
		href?: string;
		/** Marks the current page segment, rendered as plain text with aria-current. */
		current?: boolean;
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

<!-- Bulma breadcrumb navigation.
     The first item gets a home icon when it has a link.
     The current-page segment is plain text so screen readers know where they are. -->
<nav class="breadcrumb" aria-label="breadcrumbs">
	<ul>
		{#each items as item, index (item.label)}
			<li class={item.current ? "is-active" : ""}>
				{#if index === 0 && item.href}
					<!-- Root/home segment: show a house icon plus its label. -->
					<a href={item.href} class="icon-text">
						<span class="icon">
							<Home size={16} />
						</span>
						<span>{item.label}</span>
					</a>
				{:else if item.current || !item.href}
					<!-- Current page or segments without a link are non-clickable text. -->
					<span aria-current={item.current ? "page" : undefined}
						>{item.label}</span
					>
				{:else}
					<a href={item.href}>{item.label}</a>
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
