<script lang="ts">
	import { resolve } from "$app/paths";
	import type { MountInfo } from "$lib/types";

	interface Props {
		nodeId: string;
		mounts: MountInfo[];
	}

	let { nodeId, mounts }: Props = $props();
</script>

<table class="table is-fullwidth is-striped is-hoverable">
	<thead>
		<tr>
			<th>Mount</th>
		</tr>
	</thead>
	<tbody>
		{#each mounts as mount (mount.name)}
			<tr>
				<td>
					<a
						href={resolve("/[node]/[mount]", {
							node: nodeId,
							mount: mount.name,
						})}
						class="icon-text"
					>
						<span class="icon">
							<i class="fas fa-hdd"></i>
						</span>
						<span>{mount.name}</span>
					</a>
				</td>
			</tr>
		{/each}
	</tbody>
</table>
