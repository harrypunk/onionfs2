import { describe, expect, it } from "bun:test";
import { encodePathId } from "@onionfs2/shared";
import { UrlHelper, fileNameFromPathId } from "./url-helpers";

function fakeResolve(slug: string, params: Record<string, string>): string {
	return `${slug}?node=${params.node}&mount=${params.mount}&id=${params.id}`;
}

const fileSlug = "/file/[node]/[mount]/[[id]]";
const previewSlug = "/preview/[node]/[mount]/[id]";

describe("UrlHelper", () => {
	const helper = new UrlHelper(fakeResolve, fileSlug, previewSlug);

	describe("buildBrowseUrl", () => {
		it("builds a root mount URL with an empty id", () => {
			const url = helper.buildBrowseUrl("node-1", "media");
			expect(url).toBe(
				"/file/[node]/[mount]/[[id]]?node=node-1&mount=media&id=",
			);
		});

		it("encodes the directory path as a base64url id", () => {
			const url = helper.buildBrowseUrl("node-1", "media", "photos/2024");
			expect(url).toInclude("node=node-1");
			expect(url).toInclude("mount=media");
			expect(url).not.toInclude("photos/2024");
			expect(url).toInclude("id=");
		});

		it("encodes a deep nested directory", () => {
			const url = helper.buildBrowseUrl("node-1", "media", "a/b/c/d/e");
			expect(url).toInclude(`id=${encodePathId("a/b/c/d/e")}`);
		});

		it("passes through node and mount ids verbatim to the resolver", () => {
			const url = helper.buildBrowseUrl("my-node", "my-mount", "docs");
			expect(url).toInclude("node=my-node");
			expect(url).toInclude("mount=my-mount");
		});
	});

	describe("buildPreviewUrl", () => {
		it("builds a preview URL with an encoded file path", () => {
			const url = helper.buildPreviewUrl("node-1", "media", "photos/cat.jpg");
			expect(url).toStartWith(previewSlug);
			expect(url).toInclude("node=node-1");
			expect(url).toInclude("mount=media");
			expect(url).not.toInclude("photos/cat.jpg");
			expect(url).toInclude("id=");
		});

		it("encodes a file at the mount root", () => {
			const url = helper.buildPreviewUrl("node-1", "media", "readme.txt");
			expect(url).toInclude(`id=${encodePathId("readme.txt")}`);
		});

		it("encodes file paths with special characters", () => {
			const url = helper.buildPreviewUrl("node-1", "media", "my file (1).txt");
			expect(url).not.toInclude("my file (1).txt");
			expect(url).toInclude(`id=${encodePathId("my file (1).txt")}`);
		});
	});
});

describe("fileNameFromPathId", () => {
	it("returns an empty string for the root path", () => {
		const result = fileNameFromPathId("");
		expect(result.ok).toBe(true);
		if (!result.ok) return;
		expect(result.value).toBe("");
	});

	it("returns a single segment unchanged", () => {
		const result = fileNameFromPathId(encodePathId("report.pdf"));
		expect(result.ok).toBe(true);
		if (!result.ok) return;
		expect(result.value).toBe("report.pdf");
	});

	it("returns the last segment of a nested path", () => {
		const result = fileNameFromPathId(encodePathId("photos/2024/cat.jpg"));
		expect(result.ok).toBe(true);
		if (!result.ok) return;
		expect(result.value).toBe("cat.jpg");
	});

	it("returns an error for invalid base64url characters", () => {
		const result = fileNameFromPathId("not-valid!");
		expect(result.ok).toBe(false);
	});

	it("returns an error for malformed base64url padding", () => {
		const result = fileNameFromPathId("abc=");
		expect(result.ok).toBe(false);
	});
});
