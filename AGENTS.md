# AI / Agent Operating Rules

This repository is **TypstQuizPresenter**, a runtime/presenter application. It is NOT a mathematics-authoring repository.

## Hard boundaries

1. `JosViet/BienSoanTypst` is an upstream, read-only source of truth for Typst authoring syntax and shared libraries.
2. Never modify `BienSoanTypst` from work performed in this repository unless the user explicitly asks for an upstream change.
3. Do not reinterpret or rewrite authoring rules from `BienSoanTypst` here.
4. This repository may parse and consume these public constructs: `#ex`, `#choice`, `#choiceTF`, `#shortanswer`, `#loigiai`, `T[...]`, plus ordinary Typst content and public helper macros.
5. The browser renderer must compile with the real upstream `de-thi.typ`, `vietdoc.typ`, and their transitive dependencies. Do not replace Typst math/layout with approximate HTML/MathJax rendering as the canonical path.
6. Presentation question/choice text must never be reduced below 30pt. If content does not fit, prefer scrolling or splitting instead of shrinking below 30pt.
7. Changes to the parser require fixtures/tests for nested Typst delimiters.
8. Pin upstream runtime commits. Do not silently follow `main` in production.

## Current product scope

V1 is a teacher-led fullscreen quiz presenter:
- load/paste Typst source;
- parse questions;
- select questions;
- render using Typst WASM;
- fullscreen presentation;
- reveal answer and solution;
- timer and keyboard navigation.

Live multiplayer/student phones are intentionally deferred.
