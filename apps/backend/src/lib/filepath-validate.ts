const SEGMENT_SOURCE = "[a-zA-Z][a-zA-Z0-9._-]*";

const DIR_PATTERN = new RegExp(`^${SEGMENT_SOURCE}(/${SEGMENT_SOURCE})*/?$`);

/**
 * Validates that a relative path string conforms to expected segment rules.
 *
 * Rules:
 * - Must not start with `/`.
 * - Each segment must start with a letter (`[a-zA-Z]`).
 * - Remaining characters in a segment may be alphanumeric, dot, hyphen, or underscore.
 * - An empty string is considered valid (represents the relative root).
 *
 * @param path  The relative path to validate.
 * @returns     `undefined` if valid, otherwise an error message string.
 */
export function validateRelativePath(path: string): string | undefined {
	if (path === "") {
		return undefined;
	}
	if (path.startsWith("/")) {
		return "Path must be relative (no leading slash)";
	}
	if (!DIR_PATTERN.test(path)) {
		return "Each segment must start with a letter and contain only alphanumeric chars, dots, hyphens, or underscores";
	}
	return undefined;
}
