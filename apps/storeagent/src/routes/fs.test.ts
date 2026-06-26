import { afterAll, beforeAll, describe, expect, it } from "bun:test";
import { mkdtempSync, unlinkSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { encodePathId } from "@onionfs2/shared";
import { createApp } from "@/app";
import type { AppConfig } from "@/config";

const baseConfig: AppConfig = {
	bind_addr: "127.0.0.1",
	bind_port: 0,
	nats_server: "nats://localhost:4222",
	mounts: {},
	node_id: "test-node",
	cluster_url: "test.local",
	public_url: "test.local",
	announce_interval_sec: 60,
	range_chunk_size: 1024,
	max_concurrent_reads: 1,
};

describe("GET /fs/get", () => {
	const tmp = mkdtempSync(join(tmpdir(), "fs-route-test-"));
	const testFile = join(tmp, "sample.txt");
	const testContent = "0123456789abcdefghijklmnopqrstuvwxyz";
	let app: Awaited<ReturnType<typeof createApp>>;

	beforeAll(async () => {
		writeFileSync(testFile, testContent);
		app = await createApp({
			...baseConfig,
			mounts: { test: tmp },
		});
	});

	afterAll(() => {
		unlinkSync(testFile);
	});

	it("returns 200 with the full file", async () => {
		const res = await app.request("/fs/get?mount=test&dir=sample.txt");
		expect(res.status).toBe(200);
		expect(await res.text()).toBe(testContent);
		expect(res.headers.get("Accept-Ranges")).toBe("bytes");
	});

	it("returns 206 for a valid byte range", async () => {
		const res = await app.request("/fs/get?mount=test&dir=sample.txt", {
			headers: { Range: "bytes=0-9" },
		});
		expect(res.status).toBe(206);
		expect(await res.text()).toBe("0123456789");
		expect(res.headers.get("Content-Range")).toBe(
			`bytes 0-9/${testContent.length}`,
		);
	});

	it("returns 499 when the request is aborted before handling", async () => {
		const controller = new AbortController();
		controller.abort();

		const res = await app.request("/fs/get?mount=test&dir=sample.txt", {
			signal: controller.signal,
		});

		expect(res.status).toBe(499);
	});

	it("lists files with reversible ids", async () => {
		const res = await app.request("/fs/list?mount=test&dir=");
		expect(res.status).toBe(200);

		const body = (await res.json()) as {
			entries: Array<{ name: string; id?: string }>;
		};
		const sample = body.entries.find((e) => e.name === "sample.txt");
		expect(sample).toBeDefined();
		expect(sample?.id).toBe(encodePathId("sample.txt"));
	});
});

describe("GET /file/:mount/:id", () => {
	const tmp = mkdtempSync(join(tmpdir(), "file-route-test-"));
	const testFile = join(tmp, "sample.txt");
	const testContent = "0123456789abcdefghijklmnopqrstuvwxyz";
	let app: Awaited<ReturnType<typeof createApp>>;

	beforeAll(async () => {
		writeFileSync(testFile, testContent);
		app = await createApp({
			...baseConfig,
			mounts: { test: tmp },
		});
	});

	afterAll(() => {
		unlinkSync(testFile);
	});

	it("returns 200 when id exists", async () => {
		const id = encodePathId("sample.txt");
		const res = await app.request(`/file/test/${id}`);
		expect(res.status).toBe(200);
		expect(await res.text()).toBe(testContent);
	});

	it("returns 206 for a valid byte range", async () => {
		const id = encodePathId("sample.txt");
		const res = await app.request(`/file/test/${id}`, {
			headers: { Range: "bytes=0-9" },
		});
		expect(res.status).toBe(206);
		expect(await res.text()).toBe("0123456789");
	});

	it("returns 404 for unknown id", async () => {
		const res = await app.request("/file/test/unknown-id");
		expect(res.status).toBe(404);
	});

	it("returns 400 for an invalid mount name", async () => {
		const id = encodePathId("sample.txt");
		const res = await app.request(`/file/test%2F..%2Fetc/${id}`);
		expect(res.status).toBe(400);
	});
});
