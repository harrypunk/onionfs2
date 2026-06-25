<script lang="ts">
	import { page } from "$app/state";
	import EntryTable from "$lib/components/EntryTable.svelte";
	import PathBreadcrumb, {
		type BreadcrumbItem,
	} from "$lib/components/PathBreadcrumb.svelte";
	import { FileBrowserViewModel } from "$lib/viewmodels/file-browser.svelte";
	import { buildBrowseUrl, buildPreviewUrl } from "$lib/url-helpers";
	import { onMount } from "svelte";

	const nodeId = decodeURIComponent(page.params.node ?? "");
	const mountName = decodeURIComponent(page.params.mount ?? "");
	const dir = page.params.path ?? "";
	const pathSegments = dir ? dir.split("/") : [];

	const viewModel = new FileBrowserViewModel(nodeId, mountName, dir);

	function buildBreadcrumbItems(): BreadcrumbItem[] {
		const items: BreadcrumbItem[] = [
			{ label: "Nodes", href: "/" },
			{ label: nodeId },
		];

		if (pathSegments.length === 0) {
			items.push({ label: mountName, active: true });
		} else {
			items.push({
				label: mountName,
				href: buildBrowseUrl(nodeId, mountName),
			});
			for (let i = 0; i < pathSegments.length; i++) {
				const active = i === pathSegments.length - 1;
				const crumb: { label: string; active?: boolean; href?: string } = {
					label: pathSegments[i],
					active,
				};
				if (!active) {
					crumb.href = buildBrowseUrl(
						nodeId,
						mountName,
						pathSegments.slice(0, i + 1).join("/"),
					);
				}
				items.push(crumb);
			}
		}

		return items;
	}

	function entryHref(entryName: string): string {
		const nextDir = dir ? `${dir}/${entryName}` : entryName;
		return buildBrowseUrl(nodeId, mountName, nextDir);
	}

	function fileHref(entryName: string): string {
		const filePath = dir ? `${dir}/${entryName}` : entryName;
		return buildPreviewUrl(nodeId, mountName, filePath);
	}

	onMount(() => {
		viewModel.load();
	});
</script>

<section class="section">
	<div class="container">
		<PathBreadcrumb items={buildBreadcrumbItems()} />

		<h1 class="title is-3">{mountName}</h1>
		<p class="subtitle is-5 has-text-grey">{nodeId}</p>

		{#if viewModel.error}
			<div class="notification is-danger">{viewModel.error}</div>
		{:else if viewModel.isLoading}
			<div class="notification is-light">Loading directory…</div>
		{:else if viewModel.entries.length === 0}
			<div class="notification is-light">This directory is empty.</div>
		{:else}
			<EntryTable entries={viewModel.entries} {entryHref} {fileHref} />
		{/if}
	</div>
</section>
