<script lang="ts">
	import NodeOverview from "$lib/components/NodeOverview.svelte";
	import { getAppContainer } from "$lib/app/container";

	const app = getAppContainer();
</script>

<NodeOverview nodes={app.overviewVM.infoMap} />
