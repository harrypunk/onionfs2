/**
 * Reversible, URL-safe encoding for relative paths used as opaque ids.
 *
 * The id is the base64url encoding of the UTF-8 relative path. This keeps
 * nested paths and special characters out of URLs while remaining decodable
 * without a server-side lookup table.
 *
 * Uses only web-standard APIs (`TextEncoder`, `TextDecoder`, `atob`, `btoa`)
 * so the same implementation works in the browser and in Bun.
 */

const encoder = new TextEncoder();

/**
 * Encode a relative path into a URL-safe id.
 *
 * @param relativePath - Relative path inside a mount (e.g. "folder/file.txt").
 * @returns Base64url-encoded id.
 */
export function encodePathId(relativePath: string): string {
	const bytes = encoder.encode(relativePath);
	let binary = "";
	for (let i = 0; i < bytes.length; i++) {
		binary += String.fromCharCode(bytes[i]);
	}
	return btoa(binary)
		.replace(/\+/g, "-")
		.replace(/\//g, "_")
		.replace(/=+$/, "");
}

/**
 * Decode a URL-safe id back into its relative path.
 *
 * @param id - Base64url-encoded id.
 * @returns The decoded relative path, or `undefined` if the id is malformed.
 */
export function decodePathId(id: string): string | undefined {
	try {
		const base64 =
			id.replace(/-/g, "+").replace(/_/g, "/") +
			"=".repeat((4 - (id.length % 4)) % 4);
		const binary = atob(base64);
		const bytes = new Uint8Array(binary.length);
		for (let i = 0; i < binary.length; i++) {
			bytes[i] = binary.charCodeAt(i);
		}
		return new TextDecoder().decode(bytes);
	} catch {
		return undefined;
	}
}
