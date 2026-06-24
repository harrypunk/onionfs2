<script lang="ts">
	import HardDrive from "lucide-svelte/icons/hard-drive";
	import { buildBrowseUrl } from "$lib/url-helpers";
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
					<a href={buildBrowseUrl(nodeId, mount.name)} class="icon-text">
						<span class="icon">
							<HardDrive size={16} />
						</span>
						<span>{mount.name}</span>
					</a>
				</td>
			</tr>
		{/each}
	</tbody>
</table>
