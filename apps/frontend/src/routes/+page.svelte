<script lang="ts">
	import { NodeState } from "$lib/state/nodes.svelte";
	import { mockDataSource } from "$lib/datasource/mock";
	import NodeOverview from "$lib/components/NodeOverview.svelte";

	const state = new NodeState(mockDataSource);
	state.load();
</script>

{#if state.loading}
	<section class="section">
		<div class="container">
			<p class="has-text-grey">Loading nodes…</p>
		</div>
	</section>
{:else if state.error}
	<section class="section">
		<div class="container">
			<div class="notification is-danger">
				Failed to load nodes: {state.error.message}
			</div>
		</div>
	</section>
{:else}
	<NodeOverview nodes={state.nodes} />
{/if}
