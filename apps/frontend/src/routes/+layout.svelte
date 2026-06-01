<script lang="ts">
	import "bulma/css/bulma.css";
	import favicon from "$lib/assets/favicon.svg";

	let { children } = $props();
</script>

<svelte:head>
	<link rel="icon" href={favicon} />
	<title>onionfs</title>
</svelte:head>

{@render children()}
