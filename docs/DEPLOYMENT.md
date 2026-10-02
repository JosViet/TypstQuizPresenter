# Deployment Notes

## Preferred first target: ChatGPT Site / Work

The application is intentionally browser-first and static-host friendly. The critical gate is whether the Site runtime allows the Typst WASM compiler/renderer and the required worker/module loading under its CSP.

### Gate 1 — WASM smoke test

Before deeper product work, verify:
1. the page loads `@myriaddreamin/typst.ts`;
2. compiler WASM initializes;
3. renderer WASM initializes;
4. a document importing `/de-thi.typ` and `/vietdoc.typ` compiles;
5. an SVG appears in the presenter viewport.

If Gate 1 fails because of hosting restrictions, keep the same source code and deploy the Vite app to a static host that supports WASM (for example GitHub Pages, Cloudflare Pages, or Vercel).

## Classroom reliability

The MVP fetches the pinned upstream runtime from GitHub. Before regular classroom use, prefer a build-time runtime pack so the app can self-host:
- `de-thi.typ`;
- `vietdoc.typ`;
- transitive `assets/` dependencies;
- WASM compiler/renderer;
- required fonts.

This removes a live GitHub dependency during teaching.
