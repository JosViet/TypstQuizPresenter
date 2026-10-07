import assert from 'node:assert/strict';
import { test } from 'node:test';
import { normalizeShortAnswer, shortAnswerMatches } from '../src/presenter/answerCompare.ts';

test('short answer normalization ignores wrapper quotes, math dollars and spaces', () => {
  assert.equal(normalizeShortAnswer('"9"'), '9');
  assert.equal(normalizeShortAnswer(' $ 9 $ '), '9');
  assert.equal(normalizeShortAnswer('[ $x = 2$ ]'), 'x=2');
});

test('short answer comparison is deliberately textual, not CAS', () => {
  assert.equal(shortAnswerMatches('9', '"9"'), true);
  assert.equal(shortAnswerMatches(' x = 2 ', '$x=2$'), true);
  assert.equal(shortAnswerMatches('1/2', '0.5'), false);
  assert.equal(shortAnswerMatches('', '"9"'), undefined);
});
