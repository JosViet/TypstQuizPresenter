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


test('resetToFirst returns to question one and clears interaction state', () => {
  const first = makeQuestion('mcq');
  const second = { ...makeQuestion('true-false'), index: 1, id: 'tf-2' };
  const state = new PresenterState(() => {});

  state.setQuestions([first, second]);
  state.next();
  state.selectTrueFalse(0, false);
  state.reveal();

  assert.equal(state.value.current, 1);
  assert.equal(state.value.revealAnswer, true);

  state.resetToFirst();

  assert.equal(state.value.current, 0);
  assert.equal(state.value.selectedChoice, null);
  assert.deepEqual(state.value.trueFalseSelections, []);
  assert.equal(state.value.shortAnswerInput, '');
  assert.equal(state.value.revealAnswer, false);
  assert.equal(state.value.showSolution, false);
  assert.equal(state.value.timerRemaining, state.value.timerSeconds);
});


test('pauseTimer preserves remaining time and clears running state', () => {
  const state = new PresenterState(() => {});
  state.value.timerRemaining = 17;
  state.value.timerRunning = true;

  const wasRunning = state.pauseTimer();

  assert.equal(wasRunning, true);
  assert.equal(state.value.timerRunning, false);
  assert.equal(state.value.timerRemaining, 17);
});


test('figure scale override is stored per question', () => {
  const first = makeQuestion('mcq');
  const second = { ...makeQuestion('mcq'), index: 1, id: 'mcq-2' };
  const state = new PresenterState(() => {});

  state.setQuestions([first, second]);
  assert.equal(state.currentFigureScaleOverride(), null);

  state.setFigureScaleOverride(1.4);
  assert.equal(state.currentFigureScaleOverride(), 1.4);

  state.next();
  assert.equal(state.currentFigureScaleOverride(), null);
  state.setFigureScaleOverride(0.8);
  assert.equal(state.currentFigureScaleOverride(), 0.8);

  state.previous();
  assert.equal(state.currentFigureScaleOverride(), 1.4);

  state.setFigureScaleOverride(null);
  assert.equal(state.currentFigureScaleOverride(), null);
});
