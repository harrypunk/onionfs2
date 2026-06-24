<script lang="ts">
	import { onMount } from "svelte";
	import { page } from "$app/state";
	import { natsUrl } from "$lib/config";
	import EntryTable from "$lib/components/EntryTable.svelte";
	import PathBreadcrumb, {
		type BreadcrumbItem,
	} from "$lib/components/PathBreadcrumb.svelte";
	import { listMount } from "$lib/datasource/mount-source";
	import { NatsNodeDataSource } from "$lib/datasource/node-source";
	import { NodeState } from "$lib/state/nodes.svelte";
	import { buildBrowseUrl, buildPreviewUrl } from "$lib/url-helpers";
	import type { FsEntry } from "$lib/types";

	const dataSource = new NatsNodeDataSource(natsUrl);
	const nodeState = new NodeState(dataSource);

	const nodeId = $derived(decodeURIComponent(page.params.node ?? ""));
	const mountName = $derived(decodeURIComponent(page.params.mount ?? ""));
	const dir = $derived(page.params.path ?? "");
	const pathSegments = $derived(dir ? dir.split("/") : []);

	let entries = $state<FsEntry[]>([]);
	let fetchError = $state<string | null>(null);

	onMount(() => {
		nodeState.load();
	});

	$effect(() => {
		const node = nodeState.nodes.get(nodeId);
		if (!node) return;

		const subscription = listMount(node.publicUrl, mountName, dir).subscribe({
			next: (data) => {
				entries = data;
				fetchError = null;
			},
			error: (err) => {
				fetchError = err instanceof Error ? err.message : String(err);
			},
		});

		return () => subscription.unsubscribe();
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

	function fileHref(entryName: string): string {
		const filePath = dir ? `${dir}/${entryName}` : entryName;
		return buildPreviewUrl(nodeId, mountName, filePath);
	}
</script>

<section class="section">
	<div class="container">
		<PathBreadcrumb items={buildBreadcrumbItems()} />

		<h1 class="title is-3">{mountName}</h1>
		<p class="subtitle is-5 has-text-grey">{nodeId}</p>

		{#if nodeState.error}
			<div class="notification is-danger">
				Failed to load nodes: {nodeState.error.message}
			</div>
		{:else if fetchError}
			<div class="notification is-danger">{fetchError}</div>
		{:else if entries.length === 0}
			<div class="notification is-light">This directory is empty.</div>
		{:else}
			<EntryTable {entries} {entryHref} {fileHref} />
		{/if}
	</div>
</section>
