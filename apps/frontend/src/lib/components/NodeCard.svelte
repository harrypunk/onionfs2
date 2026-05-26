<script lang="ts">
	import type { NodeInfo } from "$lib/types";
	import MountTable from "./MountTable.svelte";

	interface Props {
		node: NodeInfo;
	}

	let { node }: Props = $props();
</script>

<div class="card">
	<div class="card-content">
		<div class="level is-mobile mb-4">
			<div class="level-left">
				<div>
					<p class="title is-5">{node.id}</p>
					<p class="subtitle is-6 has-text-grey">{node.clusterUrl}</p>
				</div>
			</div>
			<div class="level-right">
				<span
					class="tag is-medium"
					class:is-success={node.status === "online"}
					class:is-danger={node.status === "offline"}
				>
					{node.status}
				</span>
			</div>
		</div>

		<MountTable mounts={node.mounts} />
	</div>
</div>
