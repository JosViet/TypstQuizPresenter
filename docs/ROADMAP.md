# Roadmap

## V0.2 — Local-first classroom mode

- [x] Local workspace picker
- [x] Validate `de-thi.typ` and `vietdoc.typ`
- [x] Remember recent workspace handle in IndexedDB
- [x] Searchable local `.typ` catalog
- [x] Load selected source directly from disk
- [x] Resolve runtime/dependencies from local workspace
- [x] Keep GitHub provider only as dev/demo fallback
- [x] Document privacy boundary
- [x] Browser build smoke test with installed dependencies
- [x] Real source test: `Toan10/dataTN/0CD1-B1.typ`
- [ ] Image dependency test
- [ ] CeTZ-heavy source test

## V0.3 — Classroom polish

- [x] clickable MCQ choice selection with reveal colors;
- [x] teacher-controlled font size (10–72pt, 0.5pt step);
- [x] compact real 16:9 Typst page/margins;
- optional auto-fit remains a future enhancement;
- question selection before presentation;
- random N questions;
- tag filtering;
- optional answer shuffle with correctness remap;
- recent source files;
- explicit overflow warning.

## V1 — Stable hosted presenter

- automated static hosting;
- self-host WASM assets;
- offline/app-cache strategy;
- deployment smoke tests;
- classroom reliability checklist.

## V2 — Student participation

Deferred until presenter is stable: room code, phone responses, response histogram, team mode and session summaries.
