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
