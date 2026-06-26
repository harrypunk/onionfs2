#!/usr/bin/env bash
# Reproduces the Bun video-streaming bottleneck.
#
# Bun.file(...).slice(...).stream() is pathologically slow in Bun 1.3.x,
# while passing the sliced Blob directly to `new Response()` uses Bun's
# zero-copy sendfile path.
#
# Run with:
#   cd apps/storeagent
#   bash benchmarks/bun-stream-vs-blob.sh

set -e

TMP_DIR="/tmp/onionfs-bench-$$"
FILE="$TMP_DIR/zeroes.bin"
PORT=9870
PID_FILE="$TMP_DIR/server.pid"

mkdir -p "$TMP_DIR"
# 100 MB file
dd if=/dev/zero of="$FILE" bs=1M count=100 status=none

cat > "$TMP_DIR/server.ts" <<'EOF'
const FILE_PATH = process.env.FILE_PATH!;
const SLICE_SIZE = 256 * 1024;
Bun.serve({
  port: Number(process.env.PORT!),
  idleTimeout: 0,
  fetch(req) {
    const url = new URL(req.url);
    const file = Bun.file(FILE_PATH).slice(0, SLICE_SIZE);
    if (url.pathname === "/stream") {
      return new Response(file.stream());
    }
    if (url.pathname === "/blob") {
      return new Response(file);
    }
    return new Response("use /stream or /blob");
  },
});
console.log("ready");
EOF

FILE_PATH="$FILE" PORT="$PORT" bun run "$TMP_DIR/server.ts" >"$TMP_DIR/server.log" 2>&1 &
SERVER_PID=$!
echo "$SERVER_PID" > "$PID_FILE"

for _ in $(seq 1 30); do
  if grep -q "ready" "$TMP_DIR/server.log" 2>/dev/null; then
    break
  fi
  sleep 0.1
done

echo "--- /stream (ReadableStream) ---"
if curl -s -o /dev/null --connect-timeout 2 --max-time 5 "http://localhost:$PORT/stream"; then
  echo "finished (but probably took most of the 5 s allowance)"
else
  echo "did not finish within 5 s"
fi

echo "--- /blob (sliced Blob) ---"
curl -s -o /dev/null -w 'time: %{time_total}s size: %{size_download}\n' \
  --connect-timeout 2 --max-time 5 \
  "http://localhost:$PORT/blob"

kill "$SERVER_PID" 2>/dev/null || true
rm -rf "$TMP_DIR"
