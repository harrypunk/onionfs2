import type { FsEntry } from "$lib/types";

/**
 * Lists a directory inside a node's mount.
 *
 * Returns a Promise so the consumer can store the result in Svelte state.
 */
export async function listMount(
	publicUrl: string,
	mountName: string,
	dir = "",
): Promise<FsEntry[]> {
	const response = await fetch(
		`http://${publicUrl}/fs/list?mount=${encodeURIComponent(mountName)}&dir=${encodeURIComponent(dir)}`,
	);

	if (!response.ok) {
		const text = await response.text();
		throw new Error(`HTTP ${response.status}: ${text}`);
	}

	const data = (await response.json()) as { entries?: FsEntry[] };
	return data.entries ?? [];
}
