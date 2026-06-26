import { describe, expect, it } from "bun:test";
import { validateRelativePath } from "@/lib/filepath-validate";

describe("validateRelativePath", () => {
	describe("valid paths", () => {
		it("accepts empty string (mount root)", () => {
			expect(validateRelativePath("")).toBeUndefined();
		});

		it("accepts a single segment", () => {
			expect(validateRelativePath("photos")).toBeUndefined();
		});

		it("accepts nested segments", () => {
			expect(validateRelativePath("server/app-v1.2.1")).toBeUndefined();
		});

		it("accepts hyphens", () => {
			expect(validateRelativePath("mybin-linux-amd64")).toBeUndefined();
		});

		it("accepts dots", () => {
			expect(validateRelativePath("app.v2")).toBeUndefined();
		});

		it("accepts underscores", () => {
			expect(validateRelativePath("my_dir")).toBeUndefined();
		});

		it("accepts trailing slash", () => {
			expect(validateRelativePath("server/app-v1.2.1/")).toBeUndefined();
		});

		it("accepts mixed valid chars", () => {
			expect(validateRelativePath("a-b_c.d/e-f_g.h")).toBeUndefined();
		});

		it("accepts CJK characters", () => {
			expect(validateRelativePath("照片/東京.jpg")).toBeUndefined();
		});

		it("accepts Arabic characters", () => {
			expect(validateRelativePath("ملف/تجربة.pdf")).toBeUndefined();
		});

		it("accepts Cyrillic characters", () => {
			expect(validateRelativePath("документы/фото.png")).toBeUndefined();
		});

		it("accepts accented Latin characters", () => {
			expect(validateRelativePath("café/résumé.txt")).toBeUndefined();
		});

		it("accepts numbers after the first character", () => {
			expect(validateRelativePath("file2/photo3.jpg")).toBeUndefined();
		});
	});

	describe("invalid paths", () => {
		it("rejects leading slash", () => {
			expect(validateRelativePath("/etc")).toBe(
				"Path must be relative (no leading slash)",
			);
		});

		it("rejects segment starting with a digit", () => {
			expect(validateRelativePath("1.0/app")).toContain(
				"Each segment must start with a letter",
			);
		});

		it("rejects segment starting with a dot", () => {
			expect(validateRelativePath(".hidden")).toContain(
				"Each segment must start with a letter",
			);
		});

		it("rejects segment starting with an underscore", () => {
			expect(validateRelativePath("_config")).toContain(
				"Each segment must start with a letter",
			);
		});

		it("rejects double slash (empty segment)", () => {
			expect(validateRelativePath("a//b")).toContain(
				"Each segment must start with a letter",
			);
		});

		it("rejects dot-dot traversal", () => {
			expect(validateRelativePath("../etc")).toContain(
				"Each segment must start with a letter",
			);
		});

		it("rejects spaces", () => {
			expect(validateRelativePath("my dir")).toContain(
				"Each segment must start with a letter",
			);
		});

		it("rejects at sign", () => {
			expect(validateRelativePath("my@dir")).toContain(
				"Each segment must start with a letter",
			);
		});
	});
});
