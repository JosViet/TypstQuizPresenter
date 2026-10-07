# Typst Quiz Presenter

A teacher-led classroom quiz presenter for question banks authored in Typst.

## Privacy-first architecture (v0.4)

The production/classroom workflow is **local-first**:

```text
Public/static web app shell
        ↓
Teacher chooses local BienSoanTypst folder
        ↓
Browser receives read-only directory access
        ↓
de-thi.typ + vietdoc.typ + assets + selected .typ
are read locally in the browser
        ↓
Typst WASM compiles to SVG
```

The exercise bank is **not uploaded to the host** and is not bundled into the public web app.

The browser may remember the directory handle in IndexedDB so a later session can show “Open recent workspace”. If the browser revoked permission, the user must approve read access again.

## Why this repository exists

`BienSoanTypst` stays focused on authoring and print/PDF workflows. This repository is a separate consumer application so web runtime code, parser logic, presentation UI, and experiments do not pollute the authoring workspace.

## Main classroom workflow

1. Open Typst Quiz Presenter in Chrome/Edge.
2. Click **Chọn workspace**.
3. Select the root local folder `BienSoanTypst`.
4. Filter/select a `.typ` file, for example `Toan10/dataTN/0C1-B1.typ`.
5. The app parses its quiz questions.
6. Present fullscreen; Space reveals answer then solution.

The workspace must contain the real `de-thi.typ` and `vietdoc.typ`. Their dependencies and local images are resolved from the same workspace.

## Supported source syntax

- `#ex(...)[ ... ]`
- `#choice(...)` with `T[...]`
- `#choiceTF(...)`
- `#shortanswer(...)`
- `#loigiai[...]`
- nested Typst content, math, functions, brackets and public helper macros

## Presentation rules

- 16:9 teacher-led fullscreen;
- free numeric font control from 10–72pt in 0.5pt steps;
- MCQ choices are directly clickable and visibly selected before reveal;
- reveal colors the correct answer green and a selected wrong answer red;
- compact 16:9 page margins maximize projector space;
- answer and solution reveal are separate states.

## GitHub mode

The pinned GitHub loader remains only for development/demo. Classroom use should prefer Local Workspace so the exercise source is never fetched from or published to a public host.

See `runtime.upstream.json` for the dev/demo pin.

## Browser requirements

Local Workspace uses the File System Access API and therefore requires a compatible Chromium browser such as recent Chrome/Edge and a secure context (HTTPS or localhost).

## Local development

```bash
npm install
npm test
npm run dev
```

## Current status

`0.4.0`:

- local workspace picker;
- workspace validation;
- recent workspace handle stored in IndexedDB;
- searchable local `.typ` catalog;
- runtime/dependency loading from local disk;
- parser and Typst WASM presenter retained;
- GitHub loader demoted to dev/demo;
- exercise bank is not part of the hosted app bundle;
- clickable MCQ selection state;
- teacher-controlled font size below/above 30pt;
- compact 16:9 Typst page layout.


## Tablet / Galaxy Tab mode

- **Bắt đầu trình chiếu** hides the preparation sidebar and expands the stage.
- Touch targets are enlarged on coarse-pointer devices.
- Swipe left/right moves between questions.
- The app is installable as a PWA and requests landscape standalone display.
- A service worker caches the app shell and same-origin JS/WASM resources after the first online session. Local `.typ` workspace content is never cached by the service worker.
- A remembered workspace handle is reopened automatically when permission is still granted; otherwise the UI asks for one tap to grant read permission again.
