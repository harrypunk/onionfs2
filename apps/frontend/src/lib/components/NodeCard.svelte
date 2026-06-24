<script lang="ts">
	import type { NodeInfo } from "$lib/types";
	import MountTable from "./MountTable.svelte";

	interface Props {
		node: NodeInfo;
	}

	let { node }: Props = $props();

	function formatElapsed(ms: number): string {
		const totalSeconds = Math.floor(ms / 1000);
		if (totalSeconds < 1) return "0s";

		const hours = Math.floor(totalSeconds / 3600);
		const minutes = Math.floor((totalSeconds % 3600) / 60);
		const seconds = totalSeconds % 60;

		let result = "";
		if (hours > 0) result += `${hours}h`;
		if (minutes > 0) result += `${minutes}m`;
		if (seconds > 0 || result === "") result += `${seconds}s`;
		return result;
	}

	let now = $state(Date.now());

	$effect(() => {
		const id = setInterval(() => {
			now = Date.now();
		}, 2000);
		return () => clearInterval(id);
	});

	let timeLapsed = $derived(formatElapsed(now - node.lastSeen));
</script>

<div class="card">
	<div class="card-content">
		<div class="level is-mobile mb-4">
			<div class="level-left">
				<div>
					<p class="title is-5">{node.id}</p>
					<p class="subtitle is-6 has-text-grey">{node.publicUrl}</p>
				</div>
			</div>
			<div class="level-right">
				<span class="tag is-medium">{timeLapsed}</span>
			</div>
		</div>

		<MountTable nodeId={node.id} mounts={node.mounts} />
	</div>
</div>
