import { describe, expect, it } from "bun:test";
import { capRange, parseRangeHeader } from "@/lib/range";

describe("parseRangeHeader", () => {
	it("returns undefined for missing header", () => {
		expect(parseRangeHeader(undefined)).toBeUndefined();
	});

	it("parses an open-ended range", () => {
		expect(parseRangeHeader("bytes=1234-")).toEqual({ start: 1234 });
	});

	it("parses a closed range", () => {
		expect(parseRangeHeader("bytes=0-1023")).toEqual({ start: 0, end: 1023 });
	});

	it("rejects malformed headers", () => {
		expect(parseRangeHeader("bytes=-")).toBeUndefined();
		expect(parseRangeHeader("letters=0-10")).toBeUndefined();
		expect(parseRangeHeader("bytes=10-5")).toBeUndefined();
	});
});

describe("capRange", () => {
	it("caps an open-ended range to the chunk size", () => {
		const result = capRange(100, { start: 10 }, 20);
		expect(result).toEqual({
			start: 10,
			end: 29,
			contentLength: 20,
			rangeSpec: "10-29",
		});
	});

	it("clips the end to the file size", () => {
		const result = capRange(15, { start: 10 }, 20);
		expect(result).toEqual({
			start: 10,
			end: 14,
			contentLength: 5,
			rangeSpec: "10-14",
		});
	});

	it("respects a smaller explicit end", () => {
		const result = capRange(100, { start: 10, end: 15 }, 20);
		expect(result).toEqual({
			start: 10,
			end: 15,
			contentLength: 6,
			rangeSpec: "10-15",
		});
	});

	it("caps an explicit end that exceeds the chunk size", () => {
		const result = capRange(1000, { start: 10, end: 100 }, 20);
		expect(result).toEqual({
			start: 10,
			end: 29,
			contentLength: 20,
			rangeSpec: "10-29",
		});
	});
});
