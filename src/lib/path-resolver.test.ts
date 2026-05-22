import { describe, expect, it } from "bun:test";
import { resolve } from "node:path";
import { firstValueFrom } from "rxjs";
import { resolveFilePath } from "./path-resolver";

const MOUNTS = {
	data: "/mnt/data",
	backup: "/mnt/backup",
};

describe("resolveFilePath", () => {
	it("resolves a valid file inside a mount", async () => {
		const result = await firstValueFrom(
			resolveFilePath(MOUNTS, "data", "subdir/file.txt"),
		);
		expect(result.mount).toBe("data");
		expect(result.relativePath).toBe("subdir/file.txt");
		expect(result.realPath).toBe(resolve("/mnt/data/subdir/file.txt"));
	});

	it("resolves root of mount when file is empty", async () => {
		const result = await firstValueFrom(resolveFilePath(MOUNTS, "data", ""));
		expect(result.realPath).toBe(resolve("/mnt/data"));
	});

	it("rejects invalid mount names with EINVAL", async () => {
		const err = (await firstValueFrom(
			resolveFilePath(MOUNTS, "data-1", "file.txt"),
		).catch((e) => e)) as NodeJS.ErrnoException;

		expect(err).toBeInstanceOf(Error);
		expect(err.code).toBe("EINVAL");
		expect(err.message).toContain("Invalid mount name");
	});

	it("rejects empty mount name with EINVAL", async () => {
		const err = (await firstValueFrom(
			resolveFilePath(MOUNTS, "", "file.txt"),
		).catch((e) => e)) as NodeJS.ErrnoException;

		expect(err).toBeInstanceOf(Error);
		expect(err.code).toBe("EINVAL");
	});

	it("rejects missing mount with ENOENT", async () => {
		const err = (await firstValueFrom(
			resolveFilePath(MOUNTS, "missing", "file.txt"),
		).catch((e) => e)) as NodeJS.ErrnoException;

		expect(err).toBeInstanceOf(Error);
		expect(err.code).toBe("ENOENT");
		expect(err.message).toContain("Mount not found");
	});

	it("rejects path traversal with EACCES", async () => {
		const err = (await firstValueFrom(
			resolveFilePath(MOUNTS, "data", "../../../etc/passwd"),
		).catch((e) => e)) as NodeJS.ErrnoException;

		expect(err).toBeInstanceOf(Error);
		expect(err.code).toBe("EACCES");
		expect(err.message).toBe("Path traversal detected");
	});

	it("rejects traversal disguised with dot-dot segments", async () => {
		const err = (await firstValueFrom(
			resolveFilePath(MOUNTS, "backup", "foo/../../etc/hosts"),
		).catch((e) => e)) as NodeJS.ErrnoException;

		expect(err).toBeInstanceOf(Error);
		expect(err.code).toBe("EACCES");
	});

	it("allows legitimate nested paths", async () => {
		const result = await firstValueFrom(
			resolveFilePath(MOUNTS, "data", "a/b/c/d/file.txt"),
		);
		expect(result.realPath).toBe(resolve("/mnt/data/a/b/c/d/file.txt"));
	});
});
