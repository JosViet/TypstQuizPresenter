# Architecture

## Components

### 1. Source loader

Loads either:
- pasted `.typ` text; or
- a file path from the pinned `JosViet/BienSoanTypst` commit.

GitHub-path mode preserves relative dependency resolution.

### 2. Structural parser

The parser is delimiter-aware, not regex-only. It tracks nested `[]`, `()`, `{}`, strings, comments, and Typst math delimiters so commas/brackets inside mathematics and helper macros do not split question options incorrectly.

Output is a normalized `QuizQuestion` model.

### 3. Upstream dependency loader

Recursively scans/fetches `#import`, `#include`, `image`, `read`, JSON/CSV/YAML/XML and bibliography-style file paths. Text files are mounted with `addSource`; binary assets use `mapShadow`.

The two mandatory runtime roots are:
- `/de-thi.typ`
- `/vietdoc.typ`

### 4. Typst renderer

Uses `@myriaddreamin/typst.ts` in the browser. Each selected question is rebuilt into a presentation-only Typst document and compiled to SVG.

The generated main file is mounted next to the original source path so relative images/includes keep their original resolution base.

### 5. Presenter state

A small state machine controls:
- current question;
- answer reveal;
- solution reveal;
- timer;
- font size;
- fullscreen.

## Why semantic extraction + Typst re-render

Compiling the original `#ex` layout directly would inherit print-oriented badge/source sizes from `de-thi.typ`. HTML-only rendering would lose Typst fidelity. The hybrid approach preserves raw Typst content but applies a dedicated presentation layout where question/choice text is 30pt or larger.

## Long content policy

30pt is a hard lower bound. If content exceeds the projector viewport at 30pt, the presenter keeps 30pt and allows vertical scrolling. A later release can add automatic split suggestions.
