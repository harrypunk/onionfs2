export interface MountInfo {
	name: string;
	path: string;
	size: string;
}

export interface NodeInfo {
	id: string;
	clusterUrl: string;
	publicUrl: string;
	status: "online" | "offline";
	mounts: MountInfo[];
}
