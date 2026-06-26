<script lang="ts">
	import { page } from "$app/state";
	import { PreviewViewModel } from "$lib/viewmodels/preview.svelte";

	const nodeId = decodeURIComponent(page.params.node ?? "");
	const mountName = decodeURIComponent(page.params.mount ?? "");
	const fileId = $derived(page.params.id ?? "");

	// Recreate the view-model whenever the id changes.
	// SvelteKit reuses this component on client-side navigation, so `onMount`
	// alone is not enough.
	const viewModel = $derived.by(
		() => new PreviewViewModel(nodeId, mountName, fileId),
	);

	$effect(() => {
		viewModel.load();
	});
</script>

<section class="section">
	<div class="container">
		<nav class="breadcrumb" aria-label="breadcrumbs">
			<ul>
				<li><a href="/">Nodes</a></li>
				<li class="is-active">
					<span aria-current="page">{viewModel.fileName}</span>
				</li>
			</ul>
		</nav>

		<h1 class="title is-3">{viewModel.fileName}</h1>
		<p class="subtitle is-5 has-text-grey">{nodeId} / {mountName}</p>

		{#if viewModel.error}
			<div class="notification is-danger">
				Failed to load file location: {viewModel.error.message}
			</div>
		{/if}

		{#if viewModel.isLoading}
			<div class="notification is-light">Loading file location…</div>
		{:else if viewModel.directUrl}
			{#if viewModel.category === "image"}
				<figure class="image preview-container">
					<img src={viewModel.directUrl} alt={viewModel.fileName} />
				</figure>
			{:else if viewModel.category === "video"}
				<video class="preview-container" controls preload="metadata">
					<source src={viewModel.directUrl} />
					<p>Your browser does not support HTML5 video.</p>
				</video>
			{:else}
				<div class="box has-text-centered">
					<p class="mb-4">No preview available for this file type.</p>
					<a class="button is-primary" href={viewModel.directUrl} download>
						Download file
					</a>
				</div>
			{/if}
		{/if}
	</div>
</section>

<style>
	.preview-container {
		max-width: 100%;
		max-height: 80vh;
	}
</style>
