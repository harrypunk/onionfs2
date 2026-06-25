<script lang="ts">
	import NodeOverview from "$lib/components/NodeOverview.svelte";
	import { nodeState } from "$lib/state/nodes.svelte";
</script>

{#if nodeState.error}
	<section class="section">
		<div class="container">
			<div class="notification is-danger">
				Failed to load nodes: {nodeState.error.message}
			</div>
		</div>
	</section>
{:else}
	<NodeOverview nodes={nodeState.nodes} />
{/if}
