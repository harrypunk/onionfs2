export {};

/**
 * Benchmark storeagent range requests against a real large video file.
 *
 * 1. Start the storeagent with the companion config:
 *      ./run-storeagent.sh
 * 2. In another terminal run:
 *      cd apps/storeagent
 *      bun run benchmarks/bench-storeagent.ts
 */

const BASE_URL = "http://127.0.0.1:9999";
const MOUNT = "videos";
const FILE = "thewire-s1e1.mp4";

interface Result {
	offset: number;
	size: number;
	ms: number;
	mbps: number;
}

function human(bytes: number): string {
	const units = ["B", "KB", "MB", "GB"];
	let i = 0;
	let size = bytes;
	while (size >= 1024 && i < units.length - 1) {
		size /= 1024;
		i++;
	}
	return `${size.toFixed(2)} ${units[i]}`;
}

async function fetchRange(start: number): Promise<Result> {
	const url = new URL(`${BASE_URL}/fs/get`);
	url.searchParams.set("mount", MOUNT);
	url.searchParams.set("dir", FILE);

	const t0 = performance.now();
	const res = await fetch(url.toString(), {
		headers: { Range: `bytes=${start}-` },
	});
	const blob = await res.blob();
	const ms = performance.now() - t0;

	return {
		offset: start,
		size: blob.size,
		ms,
		mbps: (blob.size * 8) / ms / 1000,
	};
}

async function main() {
	const filePath = `/home/j9/Downloads/test-onionfs/${FILE}`;
	const stat = await Bun.file(filePath)
		.stat()
		.catch(() => null);
	if (!stat) {
		console.error(`File not found: ${filePath}`);
		process.exit(1);
	}
	console.log(`Target: ${FILE} (${human(stat.size)})\n`);

	const offsets = [0, 1_000_000_000, 5_000_000_000, 8_000_000_000];
	const results: Result[] = [];

	for (const offset of offsets) {
		if (offset >= stat.size) continue;
		const result = await fetchRange(offset);
		results.push(result);
		console.log(
			`offset ${human(offset).padStart(10)} | ` +
				`size ${human(result.size).padStart(10)} | ` +
				`time ${result.ms.toFixed(1).padStart(6)} ms | ` +
				`throughput ${result.mbps.toFixed(1)} Mbps`,
		);
	}

	const avg = results.reduce((acc, r) => acc + r.mbps, 0) / results.length;
	console.log(`\nAverage throughput: ${avg.toFixed(1)} Mbps`);
}

main().catch((err) => {
	console.error(err);
	process.exit(1);
});
