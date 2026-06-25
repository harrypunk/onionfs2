<script lang="ts">
	import { onMount } from "svelte";
	import "bulma/css/bulma.css";
	import favicon from "$lib/assets/favicon.svg";
	import { natsNodeDataSource } from "$lib/datasource/node-source.svelte";

	let { children } = $props();

	onMount(() => {
		natsNodeDataSource.start();
	});
</script>

<svelte:head>
	<link rel="icon" href={favicon} />
	<title>onionfs</title>
</svelte:head>

{@render children()}
