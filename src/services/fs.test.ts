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
import { firstValueFrom } from "rxjs";
import { FsErrorCode } from "@/lib/fs-error";
import { FileType, getFileContent, listDir } from "./fs";

describe("getFileContent", () => {
	const tmp = mkdtempSync(join(tmpdir(), "fs-test-"));
	const testFile = join(tmp, "hello.txt");
	const testDir = join(tmp, "subdir");
	const testContent = "Hello, world!";

	beforeAll(() => {
		writeFileSync(testFile, testContent);
		mkdirSync(testDir);
	});

	afterAll(() => {
		unlinkSync(testFile);
		rmdirSync(testDir);
		rmdirSync(tmp);
	});

	it("returns stream and correct size for an existing file", async () => {
		const { stream, size } = await firstValueFrom(getFileContent(testFile));
		expect(size).toBe(testContent.length);

		const reader = stream.getReader();
		const chunks: Uint8Array[] = [];
		while (true) {
			const { done, value } = await reader.read();
			if (done) break;
			chunks.push(value);
		}
		const decoded = new TextDecoder().decode(
			chunks.reduce((acc, chunk) => {
				const merged = new Uint8Array(acc.length + chunk.length);
				merged.set(acc);
				merged.set(chunk, acc.length);
				return merged;
			}, new Uint8Array(0)),
		);
		expect(decoded).toBe(testContent);
	});

	it("throws NotFound for a missing file", async () => {
		const err = (await firstValueFrom(
			getFileContent(join(tmp, "missing.txt")),
		).catch((e) => e)) as Error;
		expect(err).toBeInstanceOf(Error);
		expect((err as unknown as { code: string }).code).toBe(
			FsErrorCode.NotFound,
		);
	});

	it("throws NotAFile for a directory", async () => {
		const err = (await firstValueFrom(getFileContent(testDir)).catch(
			(e) => e,
		)) as Error;
		expect(err).toBeInstanceOf(Error);
		expect((err as unknown as { code: string }).code).toBe(
			FsErrorCode.NotAFile,
		);
	});

	it("returns sliced stream for a byte range", async () => {
		const { stream, size } = await firstValueFrom(
			getFileContent(testFile, { start: 7, end: 11 }),
		);
		expect(size).toBe(testContent.length);

		const reader = stream.getReader();
		const chunks: Uint8Array[] = [];
		while (true) {
			const { done, value } = await reader.read();
			if (done) break;
			chunks.push(value);
		}
		const decoded = new TextDecoder().decode(
			chunks.reduce((acc, chunk) => {
				const merged = new Uint8Array(acc.length + chunk.length);
				merged.set(acc);
				merged.set(chunk, acc.length);
				return merged;
			}, new Uint8Array(0)),
		);
		expect(decoded).toBe("world");
	});
});

describe("listDir", () => {
	const tmp = mkdtempSync(join(tmpdir(), "list-test-"));
	const emptyDir = join(tmp, "empty");
	const populatedDir = join(tmp, "populated");

	beforeAll(() => {
		mkdirSync(emptyDir);
		mkdirSync(populatedDir);
		writeFileSync(join(populatedDir, "a.txt"), "a");
		mkdirSync(join(populatedDir, "b-dir"));
		writeFileSync(join(populatedDir, "c.bin"), "ccc");
	});

	afterAll(() => {
		unlinkSync(join(populatedDir, "a.txt"));
		rmdirSync(join(populatedDir, "b-dir"));
		unlinkSync(join(populatedDir, "c.bin"));
		rmdirSync(populatedDir);
		rmdirSync(emptyDir);
		rmdirSync(tmp);
	});

	it("returns an empty array for an empty directory", async () => {
		const result = await firstValueFrom(listDir(emptyDir));
		expect(result.entries).toHaveLength(0);
	});

	it("classifies files and directories correctly", async () => {
		const result = await firstValueFrom(listDir(populatedDir));
		expect(result.entries).toHaveLength(3);

		const byName = Object.fromEntries(result.entries.map((e) => [e.name, e]));

		expect(byName["a.txt"].type).toBe(FileType.File);
		expect(byName["a.txt"].size).toBe(1);

		expect(byName["b-dir"].type).toBe(FileType.Directory);
		expect(byName["b-dir"].size).toBeUndefined();

		expect(byName["c.bin"].type).toBe(FileType.File);
		expect(byName["c.bin"].size).toBe(3);
	});
});
