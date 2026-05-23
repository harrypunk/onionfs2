# Agent Instructions

## Git Workflow — DO NOT COMMIT WITHOUT EXPLICIT INSTRUCTION

- **Never** run `git commit`, `git push`, `git reset`, `git rebase`, or any git mutation unless the user explicitly instructs you to.
- After making changes, run type checks and tests, report results, and **wait** for the user to say "commit" or similar before creating a commit.

## Project Architecture

Follow a strict **3-layer architecture**:

| Layer | Path | Responsibility |
|-------|------|---------------|
| **Route** | `src/routes/` | HTTP entry point only — parse headers, call services, build Responses. No filesystem or business logic. |
| **Service** | `src/services/` | Business logic — validation rules, orchestration, domain types (`FileType`, `DirEntry`, etc.). |
| **Repository** | `src/repositories/` | Raw I/O only — filesystem operations (`readDir`, `stat`, `fileStream`). No business rules. |

- Keep route files clean. Extract helpers (`fileHeaders`, `parseRangeHeader`, `fsErrorResponse`) into `src/lib/` or `src/routes/` submodules, not inline in the route handler.

## Imports

- Use `@/` path aliases for **all** cross-module imports.
- Avoid relative imports (`./`, `../`) even within the same directory.

## Error Handling

- Use `FsError` with typed `FsErrorCode` enum for all filesystem errors.
- Never compare error codes as raw strings. Always use `FsErrorCode.*` constants.
- Service layer throws `FsError`; route layer maps `FsErrorCode` to HTTP status codes.

## Async Style

- Prefer RxJS `Observable` chains (`map`, `mergeMap`, `catchError`) over `async/await` where multiple async operations compose.
- Use `firstValueFrom()` at the route boundary to unwrap Observables into Promises for Hono.

## Bun-Native APIs

- Prefer Bun native APIs over Node.js equivalents when available:
  - `Bun.file(path).stream()` instead of `node:fs.createReadStream`
  - `Bun.file(path).slice(start, end).stream()` for byte ranges
- Avoid `node:stream` `Readable` and the `Readable.toWeb()` dance entirely.

## Typed Streams

- `getFileContent` returns `Observable<{ stream: ReadableStream; size: number }>`.
- The service owns stat validation + stream creation; the route owns HTTP headers.
- No `stream as unknown as ReadableStream` casts — use native Web streams throughout.

## Testing

- Write integration tests against real temp files for service/repository layers.
- Use `mkdtempSync` + `node:fs` to create fixtures, clean up in `afterAll`.
- Cast caught errors to `FsError` (not `Error` or `unknown` objects) when asserting `err.code`.

## Tooling

```sh
# Type check
bunx tsc --noEmit

# Lint and format
bunx biome check --write .

# Run tests
bun test
```

Run all three in sequence before reporting completion.
