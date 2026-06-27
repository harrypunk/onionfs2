<script lang="ts">
	import { onMount } from "svelte";
	import { resolve } from "$app/paths";
	import "bulma/css/bulma.css";
	import favicon from "$lib/assets/favicon.svg";
	import { AppContainer, setAppContainer } from "$lib/app/container";
	import type { ResolveFn } from "$lib/url-helpers";

	const app = new AppContainer(resolve as unknown as ResolveFn);
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
