# Typst Quiz Presenter

A teacher-led classroom quiz presenter that consumes question sources authored in Typst and renders them with the **real Typst runtime** used by `JosViet/BienSoanTypst`.

## Why this repository exists

`BienSoanTypst` stays focused on authoring and print/PDF workflows. This repository is a separate consumer application so web runtime code, parser logic, presentation UI, and experiments do not pollute the authoring workspace.

## Core idea

```text
BienSoanTypst source (.typ)
        ↓
Nesting-aware quiz parser
        ↓
Normalized quiz model
        ↓
Typst WASM + pinned upstream libraries
        ↓
16:9 teacher presenter (>= 30pt)
```

The renderer loads the upstream `de-thi.typ`, `vietdoc.typ`, and their transitive assets into the Typst virtual filesystem. HTML controls navigation/timer/reveal; Typst remains authoritative for mathematical typesetting and custom helpers.

## Supported source syntax (V1)

- `#ex(...)[ ... ]`
- `#choice(...)` with `T[...]` marking the correct option
- `#choiceTF(...)`
- `#shortanswer(...)`
- `#loigiai[...]`
- nested Typst content, math, functions, brackets and helper macros

## Presentation rules

- teacher-led fullscreen mode;
- configurable font sizes: 30–44pt;
- **30pt hard minimum**;
- 16:9 viewport;
- if a question is too long at 30pt, scroll/split rather than shrink further;
- answer reveal and solution reveal are separate steps.

## Upstream pin

See `runtime.upstream.json`. The initial runtime is pinned to a known commit of `JosViet/BienSoanTypst`. Upgrading the pin is an explicit compatibility operation.

## Local development

```bash
npm install
npm test
npm run dev
```

The first Typst WASM load is large. Keep network access available on a cold start unless WASM/font assets are self-hosted later.

## Current status

`0.1.0` scaffold/MVP foundation:

- parser implemented and tested;
- upstream dependency loader implemented;
- Typst WASM renderer adapter implemented;
- 16:9 presenter UI implemented;
- runtime Typst presentation macros implemented;
- GitHub source-path loading supported.

See `docs/ROADMAP.md` for staged rollout.
