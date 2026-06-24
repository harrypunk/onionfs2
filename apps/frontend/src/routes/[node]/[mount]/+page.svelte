<script lang="ts">
	import { onMount } from "svelte";
	import { page } from "$app/state";
	import { resolve } from "$app/paths";
	import { natsUrl } from "$lib/config";
	import { listMount, type FsEntry } from "$lib/datasource/mount-source";
	import { NatsNodeDataSource } from "$lib/datasource/node-source";
	import { NodeState } from "$lib/state/nodes.svelte";

	const dataSource = new NatsNodeDataSource(natsUrl);
	const nodeState = new NodeState(dataSource);

	const nodeId = $derived(decodeURIComponent(page.params.node ?? ""));
	const mountName = $derived(decodeURIComponent(page.params.mount ?? ""));

	let entries = $state<FsEntry[]>([]);
	let fetchError = $state<string | null>(null);

	onMount(() => {
		nodeState.load();
	});

	$effect(() => {
		const node = nodeState.nodes.get(nodeId);
		if (!node) return;

		const subscription = listMount(node.publicUrl, mountName).subscribe({
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

	function typeName(type: number): string {
		switch (type) {
			case 1:
				return "Directory";
			case 2:
				return "File";
			default:
				return "Unknown";
		}
	}
</script>

<section class="section">
	<div class="container">
		<nav class="breadcrumb" aria-label="breadcrumbs">
			<ul>
				<li><a href={resolve("/")}>Nodes</a></li>
				<li>{nodeId}</li>
				<li class="is-active">
					<span aria-current="page">{mountName}</span>
				</li>
			</ul>
		</nav>

		<h1 class="title is-3">{mountName}</h1>
		<p class="subtitle is-5 has-text-grey">{nodeId}</p>

		{#if nodeState.error}
			<div class="notification is-danger">
				Failed to load nodes: {nodeState.error.message}
			</div>
		{:else if fetchError}
			<div class="notification is-danger">{fetchError}</div>
		{:else if entries.length === 0}
			<div class="notification is-light">This mount is empty.</div>
		{:else}
			<table class="table is-fullwidth is-striped is-hoverable">
				<thead>
					<tr>
						<th>Name</th>
						<th>Type</th>
						<th class="has-text-right">Size</th>
					</tr>
				</thead>
				<tbody>
					{#each entries as entry (entry.name)}
						<tr>
							<td>{entry.name}</td>
							<td>{typeName(entry.type)}</td>
							<td class="has-text-right">{entry.size ?? "-"}</td>
						</tr>
					{/each}
				</tbody>
			</table>
		{/if}
	</div>
</section>
