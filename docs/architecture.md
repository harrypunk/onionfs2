# Architecture

The storeagent follows a **3-layer architecture** with clear separation of concerns:

```
Route (apps/storeagent/src/routes/)
  └─ HTTP entry point: parse headers, call services, build Responses

Service (apps/storeagent/src/services/)
  └─ Business logic: validation rules, orchestration, domain types

Repository (apps/storeagent/src/repositories/)
  └─ Raw I/O: filesystem operations, no business rules
```

## Path Resolution & Security

Every request passes through two middleware layers:

1. **validatePath** — checks that `mount` and path params (`dir` or `file`) conform to expected formats. Returns `400` early if either is malformed.
2. **resolvePath** — resolves the logical coordinates to an absolute physical path using `node:path.resolve`, then verifies the result stays within the mount's boundary. Returns `404` for missing mounts or `403` for traversal attempts.

The handler itself never sees invalid or escaped paths.

## Typed Errors

All filesystem errors are normalized to `FsError` with a typed `FsErrorCode` enum (`ENOENT`, `EACCES`, `EPERM`, `EINVAL`, `EISDIR`). Routes and middleware use these codes — never string comparisons — to map to the correct HTTP status.
