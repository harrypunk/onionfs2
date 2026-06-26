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

		const decoded = decodePathId(id);
		expect(decoded).toEqual({ ok: true, value: "folder/b.txt" });
	});

	it("lookup resolves the correct real path", () => {
		const index = new FileIndex({ data: mountPath });
		const id = encodePathId("folder/b.txt");
		const result = index.lookup("data", id);

		expect(result).toEqual({
			ok: true,
			value: {
				mount: "data",
				relativePath: "folder/b.txt",
				realPath: join(nestedDir, "b.txt"),
			},
		});
	});

	it("lookup returns an error for an unknown mount", () => {
		const index = new FileIndex({ data: mountPath });
		const id = encodePathId("a.txt");
		const result = index.lookup("unknown", id);

		expect(result).toEqual({ ok: false, error: "mount not found" });
	});

	it("lookup returns an error for an invalid id", () => {
		const index = new FileIndex({ data: mountPath });
		const result = index.lookup("data", "not-valid-base64!!!");

		expect(result).toEqual({
			ok: false,
			error: "id contains invalid characters",
		});
	});

	it("lookup returns an error for a traversal attempt", () => {
		const index = new FileIndex({ data: mountPath });
		const id = encodePathId("../secret.txt");
		const result = index.lookup("data", id);

		expect(result).toEqual({ ok: false, error: "path traversal detected" });
	});

	it("lookup returns an error for an invalid mount name", () => {
		const index = new FileIndex({ data: mountPath });
		const id = encodePathId("a.txt");
		const result = index.lookup("data/../../etc", id);

		expect(result).toEqual({ ok: false, error: "invalid mount name" });
	});
});
