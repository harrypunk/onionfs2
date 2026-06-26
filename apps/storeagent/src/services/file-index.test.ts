import { afterAll, beforeAll, describe, expect, it } from "bun:test";
import {
	mkdirSync,
	mkdtempSync,
	rmdirSync,
	unlinkSync,
	writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { decodePathId, encodePathId } from "@onionfs2/shared";
import { FileIndex } from "@/services/file-index";

describe("FileIndex", () => {
	const tmp = mkdtempSync(join(tmpdir(), "file-index-test-"));
	const mountPath = join(tmp, "data");
	const nestedDir = join(mountPath, "folder");

	beforeAll(() => {
		mkdirSync(nestedDir, { recursive: true });
		writeFileSync(join(mountPath, "a.txt"), "a");
		writeFileSync(join(nestedDir, "b.txt"), "bb");
	});

	afterAll(() => {
		unlinkSync(join(mountPath, "a.txt"));
		unlinkSync(join(nestedDir, "b.txt"));
		rmdirSync(nestedDir);
		rmdirSync(mountPath);
		rmdirSync(tmp);
	});

	it("encodes relative paths into reversible ids", () => {
		const index = new FileIndex({ data: mountPath });
		const id = index.getId("data", "folder/b.txt");

		expect(id).toBe(encodePathId("folder/b.txt"));
		expect(decodePathId(id)).toBe("folder/b.txt");
	});

	it("lookup resolves the correct real path", () => {
		const index = new FileIndex({ data: mountPath });
		const id = encodePathId("folder/b.txt");
		const resolved = index.lookup("data", id);

		expect(resolved).toEqual({
			mount: "data",
			relativePath: "folder/b.txt",
			realPath: join(nestedDir, "b.txt"),
		});
	});

	it("lookup returns undefined for an unknown mount", () => {
		const index = new FileIndex({ data: mountPath });
		const id = encodePathId("a.txt");

		expect(index.lookup("unknown", id)).toBeUndefined();
	});

	it("lookup returns undefined for an invalid id", () => {
		const index = new FileIndex({ data: mountPath });

		expect(index.lookup("data", "not-valid-base64!!!")).toBeUndefined();
	});

	it("lookup returns undefined for a traversal attempt", () => {
		const index = new FileIndex({ data: mountPath });
		const id = encodePathId("../secret.txt");

		expect(index.lookup("data", id)).toBeUndefined();
	});

	it("lookup returns undefined for an invalid mount name", () => {
		const index = new FileIndex({ data: mountPath });
		const id = encodePathId("a.txt");

		expect(index.lookup("data/../../etc", id)).toBeUndefined();
	});
});
