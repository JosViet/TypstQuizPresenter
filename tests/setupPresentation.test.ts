import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';

// Static UI contract: check the user-facing transitions without a browser harness.
const main = readFileSync('src/main.ts', 'utf8');
const styles = readFileSync('src/styles.css', 'utf8');

test('loaded local Typst bank opens the presentation screen directly', () => {
  assert.match(main, /async function loadSelectedWorkspaceFile\(\)/);
  assert.match(main, /if \(doc\.questions\.length\) enterPresentation\(\)/);
  assert.match(main, /function enterPresentation\(\): void/);
  const from = main.indexOf('function enterPresentation(): void');
  const to = main.indexOf('async function exitPresentation()', from);
  assert.ok(from >= 0 && to > from);
  assert.equal(main.slice(from, to).includes('requestPresentationFullscreen'), false);
});

test('setup and presentation are exclusive screens', () => {
  assert.match(styles, /\.app:not\(\.presenting\) \.stage-wrap\s*\{\s*display:none;/);
  assert.match(styles, /\.app\.presenting \.sidebar\s*\{\s*display:none;/);
  assert.match(main, /id="exitPresentation">⚙ Cấu hình/);
  assert.match(main, /id="fullscreen">⛶ Toàn màn hình/);
});

test('teacher has a 200 percent figure scale option', () => {
  assert.match(main, /<option value="2">200%<\/option>/);
});
