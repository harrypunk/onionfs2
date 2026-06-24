<script lang="ts">
	import { onMount } from "svelte";
	import { natsUrl } from "$lib/config";
	import NodeOverview from "$lib/components/NodeOverview.svelte";
	import { NatsNodeDataSource } from "$lib/datasource/node-source";
	import { NodeState } from "$lib/state/nodes.svelte";

	const dataSource = new NatsNodeDataSource(natsUrl);
	const state = new NodeState(dataSource);

	onMount(() => {
		state.load();
	});
</script>

{#if state.error}
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
