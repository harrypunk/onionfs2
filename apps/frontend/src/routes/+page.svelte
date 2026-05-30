<script lang="ts">
	import NodeOverview from "$lib/components/NodeOverview.svelte";
	import { NatsNodeDataSource } from "$lib/datasource/nats";
	import { NodeState } from "$lib/state/nodes.svelte";

	const natsUrl = import.meta.env.ONIONFS_NATS_URL || "ws://nats.lan:80";
	const dataSource = new NatsNodeDataSource(natsUrl);
	const state = new NodeState(dataSource);
	state.load();
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
