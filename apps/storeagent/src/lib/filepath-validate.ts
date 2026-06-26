/**
 * A valid segment starts with a Unicode letter and continues with Unicode
 * letters, digits, marks (for composed characters), dots, hyphens, or
 * underscores. Spaces, control characters, and most symbols are rejected.
 */
const SEGMENT_SOURCE = "[\\p{L}][\\p{L}\\p{N}\\p{M}._-]*";

const DIR_PATTERN = new RegExp(
	`^${SEGMENT_SOURCE}(/${SEGMENT_SOURCE})*/?$`,
	"u",
);

/**
 * Validates that a relative path string conforms to expected segment rules.
 *
 * Rules:
 * - Must not start with `/`.
 * - Each segment must start with a Unicode letter.
 * - Remaining characters may be Unicode letters, digits, marks, dots, hyphens,
 *   or underscores.
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
		return "Each segment must start with a letter and contain only valid filename characters";
	}
	return undefined;
}
