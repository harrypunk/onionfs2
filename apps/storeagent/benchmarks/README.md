# StoreAgent streaming benchmarks

These scripts reproduce the video-streaming slowness we hit and verify the fix.

## What was wrong

`Bun.file(path).slice(start, end).stream()` is pathologically slow in Bun 1.3.x
(tens of seconds for a 256 KB slice). Passing the sliced `Blob` directly to
`new Response()` uses Bun's zero-copy sendfile path and is essentially instant.

The built-in `hono/cors` middleware also breaks sliced `Blob` responses: it
rebuilds the response from `response.body`, which for a file-backed Blob reads
the **whole** original file instead of the slice. We replaced it with a tiny
middleware that only adds headers.

## Files

- `bun-stream-vs-blob.sh` — isolated reproduction of the Bun bottleneck.
- `storeagent-config.json` — config pointing at `~/Downloads/test-onionfs`.
- `run-storeagent.sh` — starts the agent with that config.
- `bench-storeagent.ts` — fetches range chunks from the real 12 GB video file.

## Run

```sh
cd apps/storeagent

# 1. Reproduce the core Bun issue
bash benchmarks/bun-stream-vs-blob.sh

# 2. Start the agent against the Downloads test folder (another terminal)
bash benchmarks/run-storeagent.sh

# 3. Benchmark range requests on thewire-s1e1.mp4
bun run benchmarks/bench-storeagent.ts
```

## Typical results after the fix

```text
--- /stream (ReadableStream) ---
did not finish within 5 s
--- /blob (sliced Blob) ---
time: 0.0003s size: 262144
```

StoreAgent range requests should now show throughput close to your disk/network
limit instead of ~0.2 Mbps.
