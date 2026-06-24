<script lang="ts">
	import { page } from "$app/state";
	import { natsUrl } from "$lib/config";
	import { fileCategory } from "$lib/file-category";
	import { NatsNodeDataSource } from "$lib/datasource/node-source";
	import { NodeState } from "$lib/state/nodes.svelte";
	import { onMount } from "svelte";

	const dataSource = new NatsNodeDataSource(natsUrl);
	const nodeState = new NodeState(dataSource);

	const nodeId = $derived(decodeURIComponent(page.params.node ?? ""));
	const mountName = $derived(decodeURIComponent(page.params.mount ?? ""));
	const filePath = $derived(page.params.path ?? "");
	const fileName = $derived(filePath.split("/").pop() ?? "");
	const category = $derived(fileCategory(fileName));

	const directUrl = $derived(() => {
		const node = nodeState.nodes.get(nodeId);
		if (!node) return null;
		const query = new URLSearchParams({
			mount: mountName,
			dir: filePath,
		});
		return `http://${node.publicUrl}/fs/get?${query.toString()}`;
	});

	onMount(() => {
		nodeState.load();
	});
</script>

<section class="section">
	<div class="container">
		<nav class="breadcrumb" aria-label="breadcrumbs">
			<ul>
				<li><a href="/">Nodes</a></li>
				<li class="is-active">
					<span aria-current="page">{fileName}</span>
				</li>
			</ul>
		</nav>

		<h1 class="title is-3">{fileName}</h1>
		<p class="subtitle is-5 has-text-grey">{nodeId} / {mountName}</p>

		{#if nodeState.error}
			<div class="notification is-danger">
				Failed to load nodes: {nodeState.error.message}
			</div>
		{/if}

		{#if directUrl()}
			{#if category === "image"}
				<figure class="image preview-container">
					<img src={directUrl()} alt={fileName} />
				</figure>
			{:else if category === "video"}
				<video class="preview-container" controls preload="metadata">
					<source src={directUrl()} />
					<p>Your browser does not support HTML5 video.</p>
				</video>
			{:else}
				<div class="box has-text-centered">
					<p class="mb-4">No preview available for this file type.</p>
					<a class="button is-primary" href={directUrl()} download>
						Download file
					</a>
				</div>
			{/if}
		{:else}
			<div class="notification is-light">Loading file location…</div>
		{/if}
	</div>
</section>

<style>
	.preview-container {
		max-width: 100%;
		max-height: 80vh;
	}
</style>
