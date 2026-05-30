export interface MountInfo {
	name: string;
}

export interface NodeInfo {
	id: string;
	publicUrl: string;
	lastSeen: number;
	mounts: MountInfo[];
}
