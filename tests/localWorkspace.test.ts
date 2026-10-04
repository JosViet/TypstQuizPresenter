import assert from 'node:assert/strict';
import { test } from 'node:test';
import { isQuizSourcePath } from '../src/runtime/localWorkspace.ts';

test('workspace catalog keeps teaching sources', () => {
  assert.equal(isQuizSourcePath('Toan10/dataTN/0C1-B1.typ'), true);
  assert.equal(isQuizSourcePath('Toan10/KTTX1_HKI_2026-2027/de.typ'), true);
  assert.equal(isQuizSourcePath('Toan8/data/Bai1.typ'), true);
});

test('workspace catalog hides runtime/infrastructure files', () => {
  assert.equal(isQuizSourcePath('de-thi.typ'), false);
  assert.equal(isQuizSourcePath('vietdoc.typ'), false);
  assert.equal(isQuizSourcePath('assets/geometry.typ'), false);
  assert.equal(isQuizSourcePath('prompts/example.typ'), false);
  assert.equal(isQuizSourcePath('.git/tmp.typ'), false);
});
