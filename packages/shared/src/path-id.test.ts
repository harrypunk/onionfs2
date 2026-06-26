import { describe, expect, it } from "bun:test";
import { decodePathId, encodePathId } from "./path-id";

describe("encodePathId / decodePathId", () => {
	it("round-trips a simple relative path", () => {
		const id = encodePathId("folder/file.txt");
		const result = decodePathId(id);

		expect(result).toEqual({ ok: true, value: "folder/file.txt" });
	});

	it("round-trips an empty path (mount root)", () => {
		const id = encodePathId("");
		const result = decodePathId(id);

		expect(id).toBe("");
		expect(result).toEqual({ ok: true, value: "" });
	});

	it("round-trips a nested directory path", () => {
		const path = "a/b/c/d";
		const id = encodePathId(path);
		const result = decodePathId(id);

		expect(result).toEqual({ ok: true, value: path });
	});

	it("round-trips unicode paths", () => {
		const path = "movies/你好世界.mp4";
		const id = encodePathId(path);
		const result = decodePathId(id);

		expect(result).toEqual({ ok: true, value: path });
	});

	it("produces a URL-safe string without padding", () => {
		const id = encodePathId("folder/movie.mp4");
		expect(id).toMatch(/^[A-Za-z0-9_-]+$/);
		expect(id).not.toContain("=");
		expect(id).not.toContain("+");
		expect(id).not.toContain("/");
	});

	it("returns an error for malformed ids", () => {
		const result = decodePathId("not-valid!!!");

		expect(result.ok).toBe(false);
		if (!result.ok) {
			expect(result.error).toBe("id contains invalid characters");
		}
	});
});
