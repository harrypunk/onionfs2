export interface AnnounceMessage {
	node_id: string;
	mounts: string[];
	public_url: string;
	cluster_url: string;
	timestamp: number;
}
