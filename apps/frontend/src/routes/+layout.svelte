<script lang="ts">
	import { onMount } from "svelte";
	import "bulma/css/bulma.css";
	import favicon from "$lib/assets/favicon.svg";
	import { nodeState } from "$lib/state/nodes.svelte";

	let { children } = $props();

	onMount(() => {
		nodeState.load();
	});
</script>

<svelte:head>
	<link rel="icon" href={favicon} />
	<title>onionfs</title>
</svelte:head>

{@render children()}
