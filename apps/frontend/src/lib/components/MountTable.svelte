<script lang="ts">
	import HardDrive from "lucide-svelte/icons/hard-drive";
	import { getAppContainer } from "$lib/app/container";
	import type { MountInfo } from "$lib/types";

	const app = getAppContainer();

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
				<td class="p-0">
					<a
						href={app.urlHelper.buildBrowseUrl(nodeId, mount.name)}
						class="is-block px-4 py-3"
					>
						<span class="icon-text">
							<span class="icon">
								<HardDrive size={16} />
							</span>
							<span>{mount.name}</span>
						</span>
					</a>
				</td>
			</tr>
		{/each}
	</tbody>
</table>
