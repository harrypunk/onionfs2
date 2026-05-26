<script lang="ts">
	import type { NodeInfo } from "$lib/types";
	import NodeCard from "./NodeCard.svelte";

	interface Props {
		nodes: NodeInfo[];
	}

	let { nodes }: Props = $props();
</script>

<section class="section">
	<div class="container">
		<h1 class="title is-3">Homelab Nodes</h1>
		<p class="subtitle is-5 has-text-grey">onon-fs2 cluster overview</p>

		<div class="fixed-grid has-1-cols">
			<div class="grid">
				{#each nodes as node (node.id)}
					<div class="cell">
						<NodeCard {node} />
					</div>
				{/each}
			</div>
		</div>
	</div>
</section>
