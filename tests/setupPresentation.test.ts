import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';

// Static UI contract: check the user-facing transitions without a browser harness.
const main = readFileSync('src/main.ts', 'utf8');
const styles = readFileSync('src/styles.css', 'utf8');

test('loaded local Typst bank opens the presentation screen directly', () => {
  assert.match(main, /async function loadSelectedWorkspaceFile\(\)/);
  assert.match(main, /const doc = parseLoadableQuiz\(candidateText, path\)/);
  assert.match(main, /state\.setQuestions\(doc\.questions\)/);
  assert.match(main, /enterPresentation\(\)/);
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


test('configuration screen never triggers a hidden Typst compile', () => {
  assert.match(main, /if \(presentationMode\) void renderSlide\(\);/);
  assert.match(main, /renderRevision \+= 1;/);
  assert.match(main, /lastSlideSignature = '';/);
});

test('loading a second file validates before mutating the displayed lesson', () => {
  const start = main.indexOf('async function loadSelectedWorkspaceFile()');
  const end = main.indexOf('function parseCurrentSource()', start);
  assert.ok(start >= 0 && end > start);
  const load = main.slice(start, end);
  assert.ok(load.indexOf('parseLoadableQuiz(candidateText, path)') < load.indexOf('state.setQuestions(doc.questions)'));
  assert.match(load, /enterPresentation\(\);/);
  assert.ok(load.indexOf('renderer.setWorkspace(selectedWorkspace)') > load.indexOf('parseLoadableQuiz(candidateText, path)'));
});

test('the continue button uses the presentation transition without loading a file', () => {
  assert.match(main, /startPresentationButton\.addEventListener\('click', enterPresentation\)/);
  assert.match(main, /id="startPresentation" disabled>Tiếp tục trình chiếu/);
});
