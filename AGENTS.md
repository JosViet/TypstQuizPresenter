# AI / Agent Operating Rules

This repository is **TypstQuizPresenter**, a runtime/presenter application. It is NOT a mathematics-authoring repository.

## Hard boundaries

1. `JosViet/BienSoanTypst` is the upstream source of truth for Typst authoring syntax and shared libraries. Treat it as read-only unless the user explicitly asks for an upstream authoring change.
2. Do not reinterpret or rewrite the authoring rules from `BienSoanTypst` in this repository.
3. This repository parses/consumes public authoring constructs such as `#ex`, `#choice`, `#choiceTF`, `#shortanswer`, `#loigiai`, `T[...]`, ordinary Typst content, and public helper macros.
4. Canonical rendering uses real Typst through the browser WASM runtime with the actual `de-thi.typ`, `vietdoc.typ`, and their transitive dependencies. Do not replace that path with approximate HTML/MathJax rendering.
5. **Local Workspace is the production/classroom source mode.** The teacher selects the local root folder `BienSoanTypst`; content stays on the teacher's machine and is read in-browser.
6. The pinned GitHub provider is dev/demo fallback only. Do not make remote GitHub question loading the default classroom workflow.
7. Never embed GitHub credentials/tokens in frontend code and never bundle the exercise bank into the hosted app.
8. Presentation font size is teacher-adjustable (10–72pt, 0.5pt steps in the UI). Do not reintroduce a 30pt hard minimum unless the user explicitly asks.
9. Changes to the parser require fixtures/tests for nested Typst delimiters.
10. Static hosting (GitHub Pages or equivalent) does **not** require ChatGPT Work. Work is only relevant if the user specifically wants ChatGPT Sites.

## Current product scope

v0.5 is a teacher-led tablet-first fullscreen quiz presenter:
- select/reopen a local `BienSoanTypst` workspace;
- browse/filter local `.typ` sources;
- parse questions;
- render with Typst WASM and local libraries/assets;
- fullscreen presentation;
- click/select MCQ choices with visual state before reveal;
- interactive true/false selections per statement;
- short-answer text input with basic normalized-string comparison after reveal;
- reveal answer and solution;
- timer, keyboard navigation, and touch swipe navigation;
- PWA install/offline app-shell support for Galaxy Tab / Chromium tablets;
- remember the directory handle in IndexedDB when the browser permits it.

Live multiplayer/student phones are intentionally deferred until the presenter is stable.

## Hosting

The app shell may be hosted publicly because the exercise bank is not part of the bundle. GitHub Pages deployment is configured in `.github/workflows/pages.yml`; the repository must first have Pages enabled with **Settings → Pages → Source: GitHub Actions**.

11. Service-worker caching must remain limited to hosted app resources. Never cache or upload local workspace question files through network APIs.
