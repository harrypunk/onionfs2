<script lang="ts">
	interface Mount {
		name: string;
		path: string;
		size: string;
	}

	interface Node {
		id: string;
		clusterUrl: string;
		publicUrl: string;
		status: 'online' | 'offline';
		mounts: Mount[];
	}

	const nodes: Node[] = [
		{
			id: 'desktop3',
			clusterUrl: 'desktop3.svc.local',
			publicUrl: 'agent1.lan:5001',
			status: 'online',
			mounts: [
				{ name: 'data1', path: '/data1', size: '4.0 TB' },
				{ name: 'nvme1', path: '/mnt/nvme1', size: '1.9 TB' },
			],
		},
		{
			id: 'rpi4-node1',
			clusterUrl: 'rpi4-node1.svc.local',
			publicUrl: 'rpi4.lan:5001',
			status: 'online',
			mounts: [
				{ name: 'usb1', path: '/mnt/usb1', size: '465 GB' },
			],
		},
		{
			id: 'rpi4-node2',
			clusterUrl: 'rpi4-node2.svc.local',
			publicUrl: 'rpi4-2.lan:5001',
			status: 'offline',
			mounts: [
				{ name: 'usb1', path: '/mnt/usb1', size: '465 GB' },
				{ name: 'sata1', path: '/mnt/sata1', size: '1.8 TB' },
			],
		},
	];
</script>

<section class="section">
	<div class="container">
		<h1 class="title is-3">Homelab Nodes</h1>
		<p class="subtitle is-5 has-text-grey">onon-fs2 cluster overview</p>

		<div class="fixed-grid has-1-cols">
			<div class="grid">
				{#each nodes as node}
					<div class="cell">
						<div class="card">
							<div class="card-content">
								<div class="level is-mobile mb-4">
									<div class="level-left">
										<div>
											<p class="title is-5">{node.id}</p>
											<p class="subtitle is-6 has-text-grey">{node.clusterUrl}</p>
										</div>
									</div>
									<div class="level-right">
										<span
											class="tag is-medium"
											class:is-success={node.status === 'online'}
											class:is-danger={node.status === 'offline'}
										>
											{node.status}
										</span>
									</div>
								</div>

								<table class="table is-fullwidth is-striped is-hoverable">
									<thead>
										<tr>
											<th>Mount</th>
											<th>Path</th>
											<th class="has-text-right">Size</th>
										</tr>
									</thead>
									<tbody>
										{#each node.mounts as mount}
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
							</div>
						</div>
					</div>
				{/each}
			</div>
		</div>
	</div>
</section>
