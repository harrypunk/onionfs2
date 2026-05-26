<script lang="ts">
	import type { MountInfo } from "$lib/types";

	interface Props {
		mounts: MountInfo[];
	}

	let { mounts }: Props = $props();
</script>

<table class="table is-fullwidth is-striped is-hoverable">
	<thead>
		<tr>
			<th>Mount</th>
			<th>Path</th>
			<th class="has-text-right">Size</th>
		</tr>
	</thead>
	<tbody>
		{#each mounts as mount (mount.name)}
			<tr>
				<td>
					<span class="icon-text">
						<span class="icon">
							<i class="fas fa-hdd"></i>
						</span>
						<span>{mount.name}</span>
					</span>
				</td>
				<td class="has-text-grey">{mount.path}</td>
				<td class="has-text-right has-text-weight-semibold">{mount.size}</td>
			</tr>
		{/each}
	</tbody>
</table>
