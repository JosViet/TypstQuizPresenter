# Deployment Notes

## Production target

The current production direction is a normal static web app, not ChatGPT Sites. **No ChatGPT Work mode is required** for development or ordinary hosting.

The hosted bundle contains the presenter/parser/WASM runtime only. The teacher's exercise bank stays local and is opened through the File System Access API.

## GitHub Pages

A deployment workflow already exists at:

```text
.github/workflows/pages.yml
```

It:
1. installs dependencies;
2. runs tests;
3. builds the Vite app;
4. uploads `dist/`;
5. deploys through GitHub Pages.

### One-time repository setting

GitHub requires Pages to be enabled before `actions/configure-pages` can deploy.

On GitHub:

1. Open `JosViet/TypstQuizPresenter`.
2. Open **Settings**.
3. Open **Pages**.
4. Under **Build and deployment → Source**, select **GitHub Actions**.

After that, rerun the existing failed **Deploy GitHub Pages** workflow or push a new commit to `main`.

The repo may remain private if the GitHub account plan supports Pages from private repositories. The published project site can still be public; that does not expose the exercise bank because local classroom source files are not bundled into `dist/`.

## Browser requirement

Local Workspace depends on the File System Access API. Use a recent Chrome or Edge release in a secure context (HTTPS or localhost).

## Privacy boundary

The deployed app must not:
- include `BienSoanTypst` question files in its bundle;
- contain GitHub credentials;
- upload local workspace files to the host;
- switch classroom mode back to remote GitHub fetching.

See `docs/PRIVACY.md`.

## Current deployment status

CI test/build is green for v0.2. GitHub Pages workflow builds successfully and currently stops only at **Configure Pages** until the one-time Pages setting above is enabled.
