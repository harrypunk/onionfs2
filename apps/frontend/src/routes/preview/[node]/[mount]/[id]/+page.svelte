<script lang="ts">
	import { page } from "$app/state";
	import PathBreadcrumb from "$lib/components/PathBreadcrumb.svelte";
	import { getPreviewComponent } from "$lib/components/previews";
	import { getAppContainer } from "$lib/app/container";
	import { buildPreviewBreadcrumbs } from "$lib/breadcrumb-helpers";
	import { PreviewViewModel } from "$lib/viewmodels/preview.svelte";

	const app = getAppContainer();

	const nodeId = $derived(decodeURIComponent(page.params.node ?? ""));
	const mountName = $derived(decodeURIComponent(page.params.mount ?? ""));
	const fileId = $derived(page.params.id ?? "");
	const agentInfo = $derived(app.nodeInfoManager.getNodeById(nodeId));
	const nodePublicUrl = $derived(agentInfo ? agentInfo.publicUrl : "");

	// Recreate the view-model whenever the id or node info changes.
	// SvelteKit reuses this component on client-side navigation, so `onMount`
	// alone is not enough.
	const viewModel = $derived.by(
		() => new PreviewViewModel(mountName, fileId, nodePublicUrl),
	);

	const breadcrumbItems = $derived(
		buildPreviewBreadcrumbs(nodeId, mountName, fileId, app.urlHelper),
	);

	$effect(() => {
		viewModel.updateFileUrl();
	});
</script>

<section class="section">
	<div class="container">
		<PathBreadcrumb items={breadcrumbItems} />

		<h1 class="title is-3">{viewModel.fileName}</h1>

		{#if !agentInfo}
			<p>agent info is empty</p>
		{/if}

		{#if viewModel.error}
			<div class="notification is-danger">
				Failed to load file location: {viewModel.error.message}
			</div>
		{/if}

		{#if viewModel.directUrl}
			{@const Preview = getPreviewComponent(viewModel.category)}
			<Preview url={viewModel.directUrl} fileName={viewModel.fileName} />
		{/if}
	</div>
</section>
