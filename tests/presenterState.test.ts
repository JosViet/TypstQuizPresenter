import assert from 'node:assert/strict';
import { test } from 'node:test';
import type { QuizQuestion } from '../src/model/quiz.ts';
import { PresenterState } from '../src/presenter/presenterState.ts';

function makeQuestion(kind: QuizQuestion['kind']): QuizQuestion {
  return {
    id: kind,
    index: 0,
    kind,
    rawEx: '',
    stem: 'fixture',
    choices: kind === 'true-false'
      ? [{ raw: 'a', correct: true }, { raw: 'b', correct: false }]
      : kind === 'mcq'
        ? [{ raw: 'A', correct: true }, { raw: 'B', correct: false }]
        : [],
    shortAnswer: kind === 'short-answer' ? '"9"' : undefined,
    tags: [],
  };
}

test('true-false selections are stored per statement and lock after reveal', () => {
  const state = new PresenterState(() => {});
  state.setQuestions([makeQuestion('true-false')]);
  assert.deepEqual(state.value.trueFalseSelections, [null, null]);

  state.selectTrueFalse(0, false);
  state.selectTrueFalse(1, true);
  assert.deepEqual(state.value.trueFalseSelections, [false, true]);

  state.reveal();
  state.selectTrueFalse(0, true);
  assert.deepEqual(state.value.trueFalseSelections, [false, true]);
});

test('short-answer input is reset when changing question', () => {
  const state = new PresenterState(() => {});
  state.setQuestions([makeQuestion('short-answer'), { ...makeQuestion('mcq'), index: 1 }]);
  state.setShortAnswerInput('9');
  assert.equal(state.value.shortAnswerInput, '9');
  state.next();
  assert.equal(state.value.shortAnswerInput, '');
});
