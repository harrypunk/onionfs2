<script lang="ts">
	import { page } from "$app/state";
	import EntryTable from "$lib/components/EntryTable.svelte";
	import PathBreadcrumb from "$lib/components/PathBreadcrumb.svelte";
	import { getAppContainer } from "$lib/app/container";
	import { buildFilePathBreadcrumbs } from "$lib/breadcrumb-helpers";
	import { FileBrowserViewModel } from "$lib/viewmodels/file-browser.svelte";
	import { decodePathId } from "@onionfs2/shared";

	const app = getAppContainer();

	const nodeId = $derived(page.params.node ?? "");
	const mountName = $derived(page.params.mount ?? "");
	const fileId = $derived(page.params.id ?? "");
	const filePathResult = $derived(decodePathId(fileId));
	const filePath = $derived(filePathResult.ok ? filePathResult.value : "");
	const agentInfoResult = $derived(app.nodeInfoManager.getNodeById(nodeId));
	const agentPublicUrl = $derived(
		agentInfoResult ? agentInfoResult.publicUrl : "",
	);

	// Recreate the view-model whenever the file path changes.
	// SvelteKit reuses this component on client-side navigation, so `onMount`
	// alone is not enough.
	const viewModel = $derived.by(() => {
		return new FileBrowserViewModel(
			nodeId,
			mountName,
			filePath,
			agentPublicUrl,
			app.urlHelper,
		);
	});

	const breadcrumbItems = $derived.by(() => {
		const items = buildFilePathBreadcrumbs(
			nodeId,
			mountName,
			filePath,
			app.urlHelper,
		);
		// The last segment is the directory currently being viewed.
		const last = items[items.length - 1];
		if (last) {
			last.href = undefined;
			last.current = true;
		}
		return items;
	});

	$effect(() => {
		viewModel.load();
	});
</script>

<section class="section">
	<div class="container">
		<PathBreadcrumb items={breadcrumbItems} />

		<h1 class="title is-3">{mountName}</h1>
		<p class="subtitle is-5 has-text-grey">{nodeId}</p>

		{#if !filePathResult.ok}
			<p>file path decode error</p>
		{/if}

		{#if !agentInfoResult}
			<p>get agent info error</p>
		{/if}

		{#if viewModel.error}
			<div class="notification is-danger">{viewModel.error}</div>
		{:else if viewModel.isLoading}
			<div class="notification is-light">Loading directory…</div>
		{:else if viewModel.uiEntries.length === 0}
			<div class="notification is-light">This directory is empty.</div>
		{:else}
			<EntryTable entries={viewModel.uiEntries} />
		{/if}
	</div>
</section>
