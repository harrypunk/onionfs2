<script lang="ts" module>
	export interface BreadcrumbItem {
		label: string;
		href?: string;
		active?: boolean;
	}
</script>

<script lang="ts">
	import Home from "lucide-svelte/icons/home";

	interface Props {
		items: BreadcrumbItem[];
	}

	let { items }: Props = $props();
</script>

<nav class="breadcrumb" aria-label="breadcrumbs">
	<ul>
		{#each items as item, index (item.label)}
			<li class={item.active ? "is-active" : ""}>
				{#if index === 0 && item.href}
					<a href={item.href} class="icon-text">
						<span class="icon">
							<Home size={16} />
						</span>
						<span>{item.label}</span>
					</a>
				{:else if item.active || !item.href}
					<span aria-current={item.active ? "page" : undefined}
						>{item.label}</span
					>
				{:else}
					<a href={item.href}>{item.label}</a>
				{/if}
			</li>
		{/each}
	</ul>
</nav>
