# Filesystem URL Structure

The frontend uses human-readable URLs that mirror the logical filesystem layout:

```
/{node}/{mount}/subdir1/subdir2/
```

## URL Segments

| Segment   | Meaning                                                                 |
| --------- | ----------------------------------------------------------------------- |
| `node`    | Agent node ID (e.g. `node2`)                                            |
| `mount`   | Logical mount name configured on that agent (e.g. `mount3`)             |
| `...path` | Optional rest parameter containing the directory path inside the mount  |

Examples:

- `/node2/mount3/` — root of `mount3` on `node2`
- `/node2/mount3/photos/` — `photos` directory
- `/node2/mount3/photos/2024/` — nested directory

## Mapping to the Agent API

The browser page converts the URL segments into the agent's existing query API:

```
GET http://{node.publicUrl}/fs/list?mount={mount}&dir={path}
```

- `mount` is the logical mount name.
- `dir` is the rest parameter value (`photos/2024` for the example above).
- For the mount root, `dir` is empty.

## Trailing Slashes

Directory URLs end with a trailing slash. This is enforced by SvelteKit's `trailingSlash: "always"` page option on the browser route. Files (when we add file viewing) will not have a trailing slash.

## Encoding

`node` and `mount` are URL-encoded when building links and decoded when reading route parameters. The `path` rest parameter is preserved as-is by SvelteKit and passed directly to the agent API.
