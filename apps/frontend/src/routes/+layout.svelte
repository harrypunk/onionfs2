<script lang="ts">
	import { onMount } from "svelte";
	import "bulma/css/bulma.css";
	import favicon from "$lib/assets/favicon.svg";
	import { AppContainer, setAppContainer } from "$lib/app/container";

	const app = new AppContainer();
	setAppContainer(app);

	let { children } = $props();

	onMount(() => {
		app.start();
	});
</script>

<svelte:head>
	<link rel="icon" href={favicon} />
	<title>onionfs</title>
</svelte:head>

{@render children()}
