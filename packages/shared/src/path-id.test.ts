import { describe, expect, it } from "bun:test";
import { decodePathId, encodePathId } from "./path-id";

describe("encodePathId / decodePathId", () => {
	it("round-trips a simple relative path", () => {
		const id = encodePathId("folder/file.txt");
		expect(decodePathId(id)).toBe("folder/file.txt");
	});

	it("round-trips an empty path (mount root)", () => {
		const id = encodePathId("");
		expect(id).toBe("");
		expect(decodePathId(id)).toBe("");
	});

	it("round-trips a nested directory path", () => {
		const path = "a/b/c/d";
		const id = encodePathId(path);
		expect(decodePathId(id)).toBe(path);
	});

	it("round-trips unicode paths", () => {
		const path = "movies/你好世界.mp4";
		const id = encodePathId(path);
		expect(decodePathId(id)).toBe(path);
	});

	it("produces a URL-safe string without padding", () => {
		const id = encodePathId("folder/movie.mp4");
		expect(id).toMatch(/^[A-Za-z0-9_-]+$/);
		expect(id).not.toContain("=");
		expect(id).not.toContain("+");
		expect(id).not.toContain("/");
	});

	it("returns undefined for malformed ids", () => {
		expect(decodePathId("not-valid!!!")).toBeUndefined();
	});
});
