import { resolve } from "$app/paths";

export function buildBrowseUrl(
	nodeId: string,
	mountName: string,
	dir = "",
): string {
	return dir
		? resolve("/file/[node]/[mount]/[...path]", {
				node: nodeId,
				mount: mountName,
				path: dir,
			})
		: resolve("/file/[node]/[mount]", {
				node: nodeId,
				mount: mountName,
			});
}

export function buildPreviewUrl(
	nodeId: string,
	mountName: string,
	filePath: string,
): string {
	return resolve("/preview/[node]/[mount]/[...path]", {
		node: nodeId,
		mount: mountName,
		path: filePath,
	});
}
