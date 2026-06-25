<script lang="ts">
	import NodeOverview from "$lib/components/NodeOverview.svelte";
	import { overviewVM } from "$lib/viewmodels/nodelist-overview.svelte";
</script>

<NodeOverview nodes={overviewVM.infoMap} />
