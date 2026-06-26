import { resolve } from "$app/paths";
import { encodePathId, decodePathId } from "@onionfs2/shared";

export function buildBrowseUrl(
	nodeId: string,
	mountName: string,
	dir = "",
): string {
	const id = encodePathId(dir);
	return resolve("/file/[node]/[mount]/[[id]]", {
		node: nodeId,
		mount: mountName,
		id,
	});
}

export function buildPreviewUrl(
	nodeId: string,
	mountName: string,
	filePath: string,
): string {
	const id = encodePathId(filePath);
	return resolve("/preview/[node]/[mount]/[id]", {
		node: nodeId,
		mount: mountName,
		id,
	});
}

export function fileNameFromPathId(id: string): string | undefined {
	const path = decodePathId(id);
	if (path === undefined) {
		return undefined;
	}
	const segments = path.split("/");
	return segments[segments.length - 1];
}
