# Architecture

## Production source model: Local Workspace

The hosted app contains presenter/parser/WASM code only. Classroom content stays in the teacher's local clone/folder.

```text
Hosted app shell
   │
   ├─ parser
   ├─ presenter UI
   ├─ Typst WASM
   └─ quiz-runtime.typ
            │
            ▼
File System Access API (read only)
            │
            ▼
Local BienSoanTypst/
   ├─ de-thi.typ
   ├─ vietdoc.typ
   ├─ assets/
   └─ Toan*/...
```

No exercise source is uploaded as part of normal classroom use.

## Components

### 1. LocalWorkspace

The primary content provider. It receives a `FileSystemDirectoryHandle`, verifies `de-thi.typ` and `vietdoc.typ` exist at workspace root, scans teaching `.typ` files, reads source/assets on demand, recursively resolves literal dependencies, and returns a virtual runtime bundle for Typst.

### 2. Workspace persistence

The directory handle is stored in IndexedDB when possible. The handle is metadata/capability, not a copy of the exercise bank. If read permission is no longer granted, the teacher must approve it again.

### 3. Structural parser

The parser is delimiter-aware, not regex-only. It tracks nested `[]`, `()`, `{}`, strings, comments and Typst math delimiters.

### 4. Typst renderer

Uses `@myriaddreamin/typst.ts` in the browser. Each selected question is rebuilt into a presentation-only Typst document and compiled to SVG. In local mode the Typst virtual filesystem is populated from the selected local workspace, including the actual local libraries, assets and source file.

### 5. GitHub provider

The pinned GitHub provider remains a development/demo fallback. It is not the classroom production path.

### 6. Presenter state

Controls current question, answer reveal, solution reveal, timer, font size and fullscreen.

## Why semantic extraction + Typst re-render

Compiling original `#ex` print layout directly would inherit print-oriented badge/source sizes. HTML-only rendering would lose Typst fidelity. The hybrid model extracts semantics while preserving raw Typst fragments and compiles them with the real local libraries into a 16:9 presentation layout.

## Long content policy

30pt is a hard lower bound. If content exceeds the projector viewport at 30pt, keep 30pt and scroll/split rather than shrinking further.
