# File Browser Design Specification

## Goal

Design a file browser page with clear separation of concerns so that upcoming features (create folder, upload, copy, move, rename, delete) can be added without bloating the page file.

## Principles

- **Thin page**: the page file only instantiates the view model and renders components.
- **Single source of truth**: state lives in focused stores.
- **One file per operation**: commands are isolated, testable units.
- **Composed API**: the view model exposes one clean interface to the UI.
- **Backend-agnostic API layer**: all backend calls live in one place.

---

## Directory Structure

```text
src/lib/file-browser/
├── models.ts                 # Domain types
├── api.ts                    # Backend calls only
├── stores/
│   ├── browser.svelte.ts     # Path, entries, selection, view mode
│   ├── clipboard.svelte.ts   # Copy/move buffer
│   └── operations.svelte.ts  # Pending async operations + progress
├── commands/                 # One file per operation
│   ├── createFolder.ts
│   ├── upload.ts
│   ├── copy.ts
│   ├── move.ts
│   ├── rename.ts
│   └── delete.ts
├── view-model.svelte.ts      # Composes stores + commands
└── components/
    ├── FileBrowser.svelte
    ├── Toolbar.svelte
    ├── FileList.svelte
    ├── Breadcrumbs.svelte
    ├── ContextMenu.svelte
    └── dialogs/
        ├── CreateFolderDialog.svelte
        ├── RenameDialog.svelte
        └── UploadDialog.svelte
```

---

## Layer Responsibilities

### 1. Models (`models.ts`)

Pure types. No logic. Shared by all layers.

```ts
export interface FsEntry {
  id: string;
  name: string;
  path: string;
  type: 'file' | 'dir';
  size?: number;
  modifiedAt?: Date;
}

export type ViewMode = 'list' | 'grid';
export type SortKey = 'name' | 'size' | 'modifiedAt';
```

### 2. API (`api.ts`)

The only layer allowed to talk to the backend. All functions return plain promises.

```ts
export async function listEntries(path: string): Promise<FsEntry[]>
export async function createFolder(path: string): Promise<void>
export async function rename(from: string, to: string): Promise<void>
export async function remove(paths: string[]): Promise<void>
export async function copy(sources: string[], targetDir: string): Promise<void>
export async function move(sources: string[], targetDir: string): Promise<void>
export async function upload(files: File[], targetDir: string, onProgress?: (pct: number) => void): Promise<void>
```

### 3. Stores

#### Browser Store

Owns current path, directory entries, selection, and view/sort preferences.

```ts
export function createBrowserStore()
```

Exposed state:

- `currentPath`
- `entries`
- `selectedIds`
- `selectedEntries` (derived)
- `viewMode`
- `sort`

Actions:

- `navigate(path)`
- `select(id, multi?)`
- `clearSelection()`
- `setViewMode(mode)`
- `setEntries(entries)`

#### Clipboard Store

Tracks items staged for copy or move.

```ts
export function createClipboardStore()
```

Exposed state:

- `items: string[]`
- `mode: 'copy' | 'move' | null`

Actions:

- `setCopy(paths)`
- `setMove(paths)`
- `clear()`

#### Operations Store

Tracks in-flight async operations and progress.

```ts
export function createOperationsStore()
```

Exposed state:

- `pending: Map<string, { type: string; progress?: number }>`

Actions:

- `start(id, type)`
- `progress(id, percent)`
- `done(id)`

### 4. Commands (`commands/*.ts`)

Each command is a factory that receives the stores it needs and returns an action object or function.

Command responsibilities:

- Validate inputs
- Call API
- Update stores on success
- Report progress via operations store when applicable
- Surface errors to the caller

Examples:

- `createFolder(name)` → builds full path, calls API, refreshes entries
- `upload(files)` → starts operation, streams upload with progress, refreshes entries
- `copy.copyToClipboard(paths)` / `copy.paste(targetDir)`
- `move.moveToClipboard(paths)` / `move.paste(targetDir)`
- `rename(entry, newName)` → calls API, refreshes entries
- `delete(entries)` → calls API, clears selection, refreshes entries

### 5. View Model (`view-model.svelte.ts`)

Wires stores and commands into one object consumed by the page.

```ts
export function createFileBrowserViewModel()
```

Returns:

- `browser` — browser store
- `clipboard` — clipboard store
- `ops` — operations store
- `load()` — refresh current directory
- `createFolder(name)`
- `upload(files)`
- `copy` — `{ copyToClipboard, paste }`
- `move` — `{ moveToClipboard, paste }`
- `rename(entry, newName)`
- `delete(entries)`

### 6. Page + Components

The page file is minimal:

```svelte
<script lang="ts">
  import { createFileBrowserViewModel } from '$lib/file-browser/view-model.svelte';
  import FileBrowser from '$lib/file-browser/components/FileBrowser.svelte';

  const vm = createFileBrowserViewModel();
  vm.load();
</script>

<FileBrowser {vm} />
```

Components receive `vm` and call only view model actions. They never call API or mutate stores directly.

---

## Adding a New Operation

1. Add backend call in `api.ts`.
2. Create `commands/<operation>.ts`.
3. Wire the command into `view-model.svelte.ts`.
4. Add UI (button, dialog, context menu item) in `components/`.
5. No changes to the page file.

---

## Future Extensibility

| Feature | How it fits |
|---|---|
| Bulk operations | Commands accept `string[]` derived from `browser.selectedEntries`. |
| Keyboard shortcuts | Shortcuts call `vm.*` actions, same as buttons. |
| Context menu | Menu items call `vm.*` actions. |
| Tree view / grid view | Same `vm`, different component rendering. |
| Undo | Add `undoStack` store; commands push inverse operations. |
| Drag-and-drop | Drop handlers delegate to `vm.move` or `vm.upload`. |
| Search / filter | Add `query` and `filteredEntries` to browser store. |

---

## Open Questions

- Should copy/move support cross-filesystem paths?
- Should delete show a confirmation dialog or support a recycle-bin/soft-delete mode?
- Should upload support folders and directory recursion?
- Should selection use `id` or `path` as the stable key?
