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


## V0.4 — Galaxy Tab / PWA

- [x] preparation → presentation mode with hidden sidebar;
- [x] larger touch targets for coarse-pointer devices;
- [x] swipe left/right navigation;
- [x] PWA manifest and standalone landscape mode;
- [x] service-worker cache for hosted app shell / JS / WASM;
- [x] automatic recent-workspace reopen when permission remains granted;
- [x] one-tap permission recovery when Android/Chrome requires it;
- [x] remember last selected Typst source.


## V0.5 — TF / short-answer interaction

- [x] per-statement Đ/S touch chips before reveal;
- [x] correct/wrong visual feedback for TF after reveal;
- [x] short-answer input overlay for tablet/desktop;
- [x] normalized textual comparison after reveal (not CAS);
- [x] reset interaction state when changing question;
- [x] regression tests + Typst smoke coverage.


## V0.5.1 — MCQ visual polish

- [x] reset-to-first control;
- [x] separate timer reset label;
- [x] vertically centered MCQ labels for multi-line options;
- [x] circular colored A/B/C/D badges with semantic reveal colors.


## V0.6 — Cross-app presentation resilience

- [x] PWA-first presentation without Fullscreen API dependency;
- [x] one-tap fullscreen recovery after returning to a Chrome tab;
- [x] preserve slide scroll position across app/tab switching;
- [x] pause a running timer when the presenter goes to background;
- [x] never auto-resume timer after returning;
- [x] keep question/answer/reveal state unchanged on visibility/fullscreen changes;
- [x] regression coverage for fullscreen recovery decision and timer pause.


## V0.6.1 — Toán 12 parser compatibility

- [x] associate answer macros immediately following an `#ex` block;
- [x] support external MCQ, true/false and short-answer macros;
- [x] associate external `#loigiai` with the preceding question;
- [x] retain support for answer macros nested inside `#ex`;
- [x] regression fixture matching the Toán 12 dataTN layout.


## V0.7 — Figure UX

- [x] auto figure scale linked to presentation font size;
- [x] safe 70–150% auto clamp with 30pt = 100%;
- [x] per-question manual overrides: 80/100/120/140%;
- [x] runtime instrumentation for CeTZ canvas, image and immini figure content;
- [x] tap figure to open large lightbox; tap again/backdrop to close;
- [x] preserve surrounding immini markup when an answer macro is nested inside it;
- [x] regression tests for figure instrumentation, scaling and nested-immini parsing.


## V0.8 — Configuration page and wide presentation

- [x] make configuration a dedicated full-width page, not a persistent sidebar;
- [x] auto-open the presentation screen after selecting a valid bank;
- [x] explicit configuration return button, preserving loaded question state;
- [x] remove automatic Fullscreen API requests from the presentation entry flow;
- [x] retain explicit user-initiated fullscreen as an option;
- [x] expose 160/180/200% manual figure overrides;
- [x] extend Auto figure scaling ceiling to 200%;
- [x] update PWA cache version and add UI contract regression tests.


## V0.8.2 — True/false visual spacing

- [x] bring true/false card vertical spacing in line with multiple-choice math options;
- [x] vertically center TF labels, content and Đ/S buttons for multi-line statements;
- [x] add Typst smoke regression with tall fractions and row height comparison;
- [x] bump PWA cache to ship the styling change.
