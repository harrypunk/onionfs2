# Frontend Troubleshooting

## SvelteKit client-side navigation does not reload file-browser data

### Symptom

Navigating into a subdirectory updates the browser URL (e.g. to
`/file/station1-test/dw1/test-sub3/`), but:

- the UI does not update,
- the backend receives no new `/fs/list` request.

### Root cause

SvelteKit reuses the same `+page.svelte` component instance when only route
parameters change. The file-browser page created its view-model in the script
body and called `viewModel.load()` only inside `onMount()`. `onMount()` does
not run again during client-side param-only navigation, so the new directory
was never fetched.

### Fix

Make the page reactive to `page.params.path`:

1. Derive `dir` and `pathSegments` from `$page.params.path`.
2. Recreate the view-model whenever `dir` changes with `$derived.by(...)`.
3. Trigger loading with `$effect(() => viewModel.load())` instead of
   `onMount()`.
4. Strip the trailing slash that `trailingSlash = "always"` preserves, so
   path math and generated links stay clean.

```svelte
const dir = $derived((page.params.path ?? "").replace(/\/+$/, ""));
const pathSegments = $derived(dir ? dir.split("/") : []);

const viewModel = $derived.by(
    () => new FileBrowserViewModel(nodeId, mountName, dir),
);

$effect(() => {
    viewModel.load();
});
```

### Related files

- `apps/frontend/src/routes/file/[node]/[mount]/[...path]/+page.svelte`
- `apps/frontend/src/lib/viewmodels/file-browser.svelte.ts`
- `apps/frontend/src/routes/file/[node]/[mount]/[...path]/+page.ts`
  (`trailingSlash = "always"`)
