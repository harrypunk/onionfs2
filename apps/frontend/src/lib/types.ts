export interface MountInfo {
	name: string;
}

export interface NodeInfo {
	id: string;
	publicUrl: string;
	lastSeen: number;
	mounts: MountInfo[];
}

export interface FsEntry {
	name: string;
	type: number;
	size?: number;
	/** Opaque id for direct file access via the agent's `/file/:id` endpoint. */
	id?: string;
}

export enum SortKey {
	Name = "name",
	Type = "type",
	Size = "size",
}

export enum ViewMode {
	List = "list",
	Grid = "grid",
}

export enum FileAction {
	Download = "download",
	Rename = "rename",
	Copy = "copy",
	Move = "move",
	Delete = "delete",
}
