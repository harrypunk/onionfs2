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

import type { Result } from "./types";

const encoder = new TextEncoder();

/** Result of decoding a path id. */
export type DecodePathIdResult = Result<string>;

/**
 * Encode a relative path into a URL-safe id.
 *
 * @param relativePath - Relative path inside a mount (e.g. "folder/file.txt").
 * @returns Base64url-encoded id.
 */
export function encodePathId(relativePath: string): string {
	return bytesToBase64Url(encoder.encode(relativePath));
}

/**
 * Decode a URL-safe id back into its relative path.
 *
 * @param id - Base64url-encoded id.
 * @returns A result containing the decoded relative path or an error message.
 */
export function decodePathId(id: string): DecodePathIdResult {
	if (id === "") {
		return { ok: true, value: "" };
	}

	if (!isBase64Url(id)) {
		return { ok: false, error: "id contains invalid characters" };
	}

	try {
		const path = new TextDecoder().decode(base64UrlToBytes(id));
		return { ok: true, value: path };
	} catch (err) {
		const message = err instanceof Error ? err.message : "failed to decode id";
		return { ok: false, error: message };
	}
}

function isBase64Url(id: string): boolean {
	return /^[A-Za-z0-9_-]+$/.test(id);
}

function bytesToBase64Url(bytes: Uint8Array): string {
	const binary = Array.from(bytes).reduce(
		(acc, byte) => acc + String.fromCharCode(byte),
		"",
	);
	return btoa(binary)
		.replace(/\+/g, "-")
		.replace(/\//g, "_")
		.replace(/=+$/, "");
}

function base64UrlToBytes(id: string): Uint8Array {
	const base64 = id.replace(/-/g, "+").replace(/_/g, "/");
	const padding = "=".repeat((4 - (base64.length % 4)) % 4);
	const binary = atob(`${base64}${padding}`);
	const bytes = Array.from(binary).map((char) => char.charCodeAt(0));
	return new Uint8Array(bytes);
}
