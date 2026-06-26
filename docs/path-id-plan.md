# Path-id design plan

## Current decision (option 1)

Frontend and backend use **reversible base64url ids** that encode only the
relative path inside a mount.

- Id format: `base64url(utf8(relativePath))`
- Mount name stays in the URL, not in the id.
- Backend resolves an id by decoding it and validating it against the mount's
  base directory.
- No server-side lookup table is required.

Example URLs:

```text
/file/node1/mount1/                  # mount root ([[id]] is empty)
/file/node1/mount1/Zm9sZGVy          # folder directory
/preview/node1/mount1/Zm9sZGVy8J+qmA # file preview
```

## Why option 1

- Simple, no extra backend endpoint or state.
- Works identically for files and directories.
- Keeps special characters and nested slashes out of the visible URL path.
- Same implementation runs in the browser and in Bun via web-standard APIs.

## Known limitation

Ids grow with the relative path length. A deeply nested path such as
`a/b/c/d/e/f/g/h/file.txt` produces a long id.

## Future evaluation

After this is running in production-like conditions, evaluate whether id
length is actually a problem. If it is, consider:

1. **Compression** (`deflate` / `zlib` then base64url)
   - Pros: can significantly shorten long, repetitive paths.
   - Cons: adds a dependency; may be longer for short paths; slightly slower.

2. **Short id + backend lookup table**
   - Pros: short, fixed-length ids.
   - Cons: requires server-side state and a `/fs/lookup` endpoint; not
     strictly reversible.

3. **Hybrid approach**
   - Encode short paths directly with base64url.
   - Hash long paths and store the mapping in a lookup table.
   - More complex; only worthwhile if both short ids and rare long paths matter.

Keep the shared `encodePathId` / `decodePathId` API stable so a future swap is
localized to `packages/shared/src/path-id.ts`.
