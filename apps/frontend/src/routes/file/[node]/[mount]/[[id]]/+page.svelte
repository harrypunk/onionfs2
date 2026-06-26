<script lang="ts">
	import { page } from "$app/state";
	import EntryTable from "$lib/components/EntryTable.svelte";
	import PathBreadcrumb, {
		type BreadcrumbItem,
	} from "$lib/components/PathBreadcrumb.svelte";
	import { FileBrowserViewModel } from "$lib/viewmodels/file-browser.svelte";
	import { buildBrowseUrl, buildPreviewUrl } from "$lib/url-helpers";
	import { decodePathId } from "@onionfs2/shared";
	import type { FsEntry } from "$lib/types";

	const nodeId = decodeURIComponent(page.params.node ?? "");
	const mountName = decodeURIComponent(page.params.mount ?? "");

	const id = $derived(page.params.id ?? "");
	const dir = $derived(decodePathId(id));
	const decodeError = $derived(dir === undefined);
	const pathSegments = $derived(dir ? dir.split("/") : []);

	// Recreate the view-model whenever the directory path changes.
	// SvelteKit reuses this component on client-side navigation, so `onMount`
	// alone is not enough.
	const viewModel = $derived.by(
		() => new FileBrowserViewModel(nodeId, mountName, dir ?? ""),
	);

	$effect(() => {
		viewModel.load();
	});

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

	function fileHref(entry: FsEntry): string {
		const filePath = dir ? `${dir}/${entry.name}` : entry.name;
		return buildPreviewUrl(nodeId, mountName, filePath);
	}
</script>

<section class="section">
	<div class="container">
		<PathBreadcrumb items={buildBreadcrumbItems()} />

		<h1 class="title is-3">{mountName}</h1>
		<p class="subtitle is-5 has-text-grey">{nodeId}</p>

		{#if decodeError}
			<div class="notification is-danger">Invalid path id.</div>
		{:else if viewModel.error}
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
