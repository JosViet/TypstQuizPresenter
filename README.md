# Typst Quiz Presenter

A teacher-led classroom quiz presenter for question banks authored in Typst.

## Privacy-first architecture (v0.8)

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

`0.7.0`:

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


## Question interaction

- MCQ: tap one choice, then reveal correct/wrong colors.
- True/False: each statement has Đ/S chips; selections lock after reveal and are compared visually to the canonical truth values.
- Short answer: type into the on-slide input. After reveal, the app performs only basic normalized-string comparison; it is intentionally not a CAS and the canonical Typst answer remains authoritative.


### v0.5.1 classroom polish

- `↺ Câu 1` resets the quiz to the first question and clears current interaction/reveal state.
- MCQ labels are circular colored badges with white letters and vertical centering for multi-line choices.
- Correct/wrong reveal colors override the decorative badge palette.


## Cross-app teaching workflow

The presenter is designed to survive frequent switching to another teaching app and back:

- installed PWA mode does not depend on the browser Fullscreen API;
- in a normal Chrome tab, if fullscreen is lost after switching tabs/apps, the current presentation shows a one-tap **Trở lại toàn màn hình** recovery surface;
- current question, selected answers, reveal state, font size and slide scroll position are kept while the app is backgrounded;
- a running timer pauses automatically when the app goes to the background and never auto-resumes without the teacher;
- fullscreen recovery is never shown in standalone/PWA mode.


### v0.6.1 — Toán 12 parser compatibility

The parser supports both authoring layouts used by the upstream repository:

- answer macro nested inside `#ex[...]`;
- answer macro placed immediately after `#ex[...]`, as used heavily by `Toan12/dataTN`.

Adjacent `#choice`, `#choiceTF`, `#shortanswer` and `#loigiai` are associated with the preceding exercise up to the next `#ex`.


## Figure scaling and tap-to-zoom

- Figure scale defaults to **Auto**: 30pt text = 100%, with proportional scaling clamped to 70–150%.
- Per-question overrides are available at 80%, 100%, 120% and 140%; returning to a previously adjusted question restores its override.
- Presenter instrumentation wraps CeTZ `#canvas`, direct `#image`, and the figure body of `#immini` without modifying `BienSoanTypst`.
- Tapping a rendered figure opens a large in-app lightbox. Tapping the enlarged figure or backdrop closes it.
- Answer macros nested inside `#immini` are removed from the stem without breaking the surrounding figure layout.


### v0.7.2 — CeTZ label scale fix

- CeTZ figures in the large-font quiz stem now use the original document's 11pt label typography *inside the figure* before the complete figure is scaled.
- This prevents point labels (A', B', C', D', etc.) from inheriting 30–36pt slide text while coordinates remain tied to fixed CeTZ units.
- Figure-scale Auto and per-question overrides continue to scale geometry and labels uniformly.


## v0.8 — Separate setup and presentation screens

1. Open the configuration screen to select/reopen a local workspace and choose a Typst source.
2. Once a valid source with questions is loaded, the app switches **automatically** to the dedicated presentation screen. The workspace browser disappears completely.
3. Return to setup using **⚙ Cấu hình** in the presentation toolbar. The current question is retained when returning to the slide.
4. **⛶ Toàn màn hình** is an optional user-triggered action. Presentation never invokes browser fullscreen automatically; after changing browser tabs, the large presentation screen remains active without a recovery interaction.
5. Figures can be overridden individually up to **200%**, including 160%, 180% and 200%. Auto scale also supports 200% at 60pt+, keeping 30pt=100%.

The host browser address/tab bars are still controlled by Android/Chrome; only an installed PWA or optional Fullscreen API can hide them.


### v0.8.1 — MCQ fraction layout correction

- Increased measured vertical inset in MCQ option cards, proportional to the font size, to prevent large mathematical fractions from protruding outside choice borders.
- Added a real Typst regression using the fraction layout from Toán 12 question 12; original source files remain unchanged.


### v0.8.2 — True/false math card spacing

- True/false statements now receive font-relative vertical padding (matching MCQ options) so large fractions stay inside the bordered card.
- Each statement's letter, formula content, and two Đ/S chips share vertical-centered grid alignment, including multi-line statements.
- True/false selected/correct/wrong behavior and question-bank sources are unchanged.
