import { decodePathId } from "@onionfs2/shared";
import type { BreadcrumbItem } from "$lib/components/PathBreadcrumb.svelte";
import type { UrlHelper } from "$lib/url-helpers";

/** Build the clickable prefix shared by the file browser and preview pages.
 *
 * Returns: Home → Node → Mount → one link per directory segment.
 * The caller marks the final segment (current directory or file) as active.
 *
 * @param filePath Decoded directory path relative to the mount root.
 *                 Empty string means we are at the mount root. */
export function buildFilePathBreadcrumbs(
	nodeId: string,
	mountName: string,
	filePath: string,
	urlHelper: UrlHelper,
): BreadcrumbItem[] {
	const items: BreadcrumbItem[] = [
		{ label: "Home", href: "/" },
		{ label: nodeId, href: "/" },
		// Mount always links to the mount root listing.
		{
			label: mountName,
			href: urlHelper.buildBrowseUrl(nodeId, mountName, ""),
		},
	];

	const segments = filePath.split("/").filter(Boolean);
	const subdirItems = segments.reduce<{ path: string; items: BreadcrumbItem[] }>(
		(acc, segment) => {
			acc.path += `${acc.path ? "/" : ""}${segment}`;
			acc.items.push({
				label: segment,
				href: urlHelper.buildBrowseUrl(nodeId, mountName, acc.path),
			});
			return acc;
		},
		{ path: "", items: [] },
	).items;
	items.push(...subdirItems);

	return items;
}

/** Build breadcrumbs for the preview page from the encoded file id.
 *
 * The file's containing directory segments are clickable; the file name itself
 * is the active (current) segment. */
export function buildPreviewBreadcrumbs(
	nodeId: string,
	mountName: string,
	fileId: string,
	urlHelper: UrlHelper,
): BreadcrumbItem[] {
	const decoded = decodePathId(fileId);
	if (!decoded.ok) {
		return [
			{ label: "Home", href: "/" },
			{ label: nodeId, href: "/" },
			{
				label: mountName,
				href: urlHelper.buildBrowseUrl(nodeId, mountName, ""),
			},
			{ label: fileId, current: true },
		];
	}

	const fullPath = decoded.value;
	const lastSlash = fullPath.lastIndexOf("/");
	const dirPath = lastSlash === -1 ? "" : fullPath.slice(0, lastSlash);
	const fileName = lastSlash === -1 ? fullPath : fullPath.slice(lastSlash + 1);

	const items = buildFilePathBreadcrumbs(
		nodeId,
		mountName,
		dirPath,
		urlHelper,
	);
	items.push({ label: fileName, current: true });
	return items;
}
