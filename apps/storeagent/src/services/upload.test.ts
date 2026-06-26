import { describe, expect, test } from "bun:test";
import { mkdtempSync, rmdirSync, rmSync, unlinkSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { firstValueFrom } from "rxjs";
import { FsErrorCode } from "@/lib/fs-error";
import {
	completeMultipartUpload,
	createMultipartSession,
	uploadFile,
	uploadPart,
} from "@/services/upload";
import { InMemoryUploadSessionManager } from "@/services/upload-session";

describe("uploadFile", () => {
	function tempDir(): string {
		return mkdtempSync(join(tmpdir(), "upload-test-"));
	}

	function streamFrom(data: Uint8Array): ReadableStream<Uint8Array> {
		return new ReadableStream({
			start(controller) {
				controller.enqueue(data);
				controller.close();
			},
		});
	}

	test("writes a new file and returns path + size", async () => {
		const dir = tempDir();
		const target = join(dir, "new.txt");
		const data = new TextEncoder().encode("hello world");

		const result = await firstValueFrom(uploadFile(target, streamFrom(data)));

		expect(result.path).toBe(target);
		expect(result.size).toBe(data.byteLength);

		const content = await Bun.file(target).text();
		expect(content).toBe("hello world");

		unlinkSync(target);
		rmdirSync(dir);
	});

	test("rejects null body", async () => {
		const err = (await firstValueFrom(uploadFile("/tmp/foo", null)).catch(
			(e) => e,
		)) as {
			code: FsErrorCode;
		};
		expect(err.code).toBe(FsErrorCode.InvalidArgument);
	});
});

describe("multipart upload", () => {
	function tempDir(): string {
		return mkdtempSync(join(tmpdir(), "multipart-test-"));
	}

	function streamFrom(data: Uint8Array): ReadableStream<Uint8Array> {
		return new ReadableStream({
			start(controller) {
				controller.enqueue(data);
				controller.close();
			},
		});
	}

	test("creates session, uploads parts, and completes", async () => {
		const manager = new InMemoryUploadSessionManager();
		const dir = tempDir();
		const target = join(dir, "final.bin");

		const uploadId = await firstValueFrom(
			createMultipartSession(target, "test", "final.bin", manager),
		);
		expect(uploadId).toBeString();

		await firstValueFrom(
			uploadPart(uploadId, 1, streamFrom(new Uint8Array([1, 2, 3])), manager),
		);
		await firstValueFrom(
			uploadPart(uploadId, 2, streamFrom(new Uint8Array([4, 5, 6])), manager),
		);
		await firstValueFrom(
			uploadPart(uploadId, 3, streamFrom(new Uint8Array([7, 8, 9])), manager),
		);

		const result = await firstValueFrom(
			completeMultipartUpload(uploadId, manager),
		);
		expect(result.path).toBe(target);
		expect(result.size).toBe(9);

		const bytes = await Bun.file(target).bytes();
		expect(Array.from(bytes)).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9]);

		unlinkSync(target);
		rmdirSync(dir);
	});

	test("rejects upload to missing session", async () => {
		const manager = new InMemoryUploadSessionManager();
		const err = (await firstValueFrom(
			uploadPart("missing-id", 1, streamFrom(new Uint8Array([1])), manager),
		).catch((e) => e)) as { code: FsErrorCode };
		expect(err.code).toBe(FsErrorCode.NotFound);
	});

	test("rejects complete on missing session", async () => {
		const manager = new InMemoryUploadSessionManager();
		const err = (await firstValueFrom(
			completeMultipartUpload("missing-id", manager),
		).catch((e) => e)) as {
			code: FsErrorCode;
		};
		expect(err.code).toBe(FsErrorCode.NotFound);
	});

	test("rejects null body for part upload", async () => {
		const manager = new InMemoryUploadSessionManager();
		const dir = tempDir();
		const target = join(dir, "final.bin");
		const uploadId = await firstValueFrom(
			createMultipartSession(target, "test", "final.bin", manager),
		);

		const err = (await firstValueFrom(
			uploadPart(uploadId, 1, null, manager),
		).catch((e) => e)) as {
			code: FsErrorCode;
		};
		expect(err.code).toBe(FsErrorCode.InvalidArgument);

		rmSync(`${target}-upload-${uploadId}`, { recursive: true, force: true });
		rmdirSync(dir);
	});
});
