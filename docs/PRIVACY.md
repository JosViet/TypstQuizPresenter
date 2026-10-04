# Privacy and Content Exposure

## What a hosted copy contains

The hosted application may contain HTML/CSS/JavaScript, parser logic, Typst WASM compiler/renderer and `quiz-runtime.typ`. It should **not** contain or bundle the teacher's exercise bank.

## Local Workspace mode

When the teacher chooses a local `BienSoanTypst` directory, the browser receives a read-only directory handle for that user session. Files are read by JavaScript in the browser and passed to the in-browser Typst runtime. Normal local mode does not upload those file contents to the hosting server.

## Remembering a workspace

A `FileSystemDirectoryHandle` may be stored in IndexedDB. This is a browser capability reference, not a copied folder. Browser permission rules still apply and the browser can require approval again.

## Security rules

- Never embed a GitHub personal access token in frontend code.
- Never bundle the private exercise bank into `dist/`.
- Never make GitHub remote loading the default classroom path.
- Treat any content fetched by a public browser page as inspectable by the person using that browser.
- Keep Local Workspace read-only.
