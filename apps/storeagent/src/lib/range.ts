/** Byte range for partial content requests. */
export interface ByteRange {
	/** Inclusive start byte index. */
	start: number;
	/** Inclusive end byte index; omitted means read to EOF. */
	end?: number;
}

/**
 * Parse a single `bytes=start-end` Range header.
 *
 * @returns Parsed range or `undefined` if the header is missing/malformed.
 */
export function parseRangeHeader(
	header: string | undefined,
): ByteRange | undefined {
	if (!header) return undefined;
	const match = header.match(/^bytes=(\d+)-(\d*)$/);
	if (!match) return undefined;
	const start = Number.parseInt(match[1], 10);
	const end = match[2] ? Number.parseInt(match[2], 10) : undefined;
	if (end !== undefined && start > end) return undefined;
	return { start, end };
}

/** Result of clamping a requested range to a maximum chunk size. */
export interface CappedRange {
	start: number;
	end: number;
	contentLength: number;
	rangeSpec: string;
}

/**
 * Clamp a requested byte range to a maximum chunk size.
 *
 * The caller is responsible for returning 416 if `range.start >= size`.
 */
export function capRange(
	size: number,
	range: ByteRange,
	maxChunk: number,
): CappedRange {
	const maxEnd = Math.min(size - 1, range.start + maxChunk - 1);
	const end = range.end !== undefined ? Math.min(range.end, maxEnd) : maxEnd;
	const contentLength = end - range.start + 1;
	return {
		start: range.start,
		end,
		contentLength,
		rangeSpec: `${range.start}-${end}`,
	};
}
