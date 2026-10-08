import assert from 'node:assert/strict';
import { test } from 'node:test';
import type { QuizQuestion } from '../src/model/quiz.ts';
import { buildQuizDocument } from '../src/runtime/quizDocument.ts';

const question: QuizQuestion = {
  id: 'fixture#1',
  index: 0,
  kind: 'mcq',
  sourcePath: 'Toan10/dataTN/fixture.typ',
  rawEx: '',
  stem: 'Chọn đáp án đúng.',
  choices: [
    { raw: '$1$', correct: false },
    { raw: '$2$', correct: true },
    { raw: '$3$', correct: false },
    { raw: '$4$', correct: false },
  ],
  solution: '$2$ là đáp án đúng.',
  tags: [],
};

test('generated Typst uses real line breaks between tuple items', () => {
  const source = buildQuizDocument(question, {
    selectedChoice: 2,
    revealAnswer: false,
    showSolution: false,
    fontSize: 24.5,
  });

  assert.equal(source.includes('\\\\n'), false);
  assert.match(source, /\[\$1\$\],\n\s+\[\$2\$\]/);
  assert.match(source, /selected: 2/);
  assert.match(source, /font-size: 24\.5pt/);
});

test('generated document is a compact fixed 16:9 page', () => {
  const source = buildQuizDocument(question, {
    revealAnswer: false,
    showSolution: false,
    fontSize: 30,
  });

  assert.match(source, /width: 13\.333in/);
  assert.match(source, /height: 7\.5in/);
  assert.match(source, /margin: \(x: 18pt, y: 10pt\)/);
});


test('generated true-false document carries teacher selections', () => {
  const tfQuestion: QuizQuestion = {
    ...question,
    id: 'fixture#tf',
    kind: 'true-false',
    choices: [
      { raw: '$1 < 2$', correct: true },
      { raw: '$3 < 1$', correct: false },
    ],
  };

  const source = buildQuizDocument(tfQuestion, {
    trueFalseSelections: [false, null],
    revealAnswer: false,
    showSolution: false,
    fontSize: 28,
  });

  assert.match(source, /truths: \(true, false,\)/);
  assert.match(source, /selections: \(false, none,\)/);
});


test('auto-scales figures with font size and allows manual override', () => {
  const figureQuestion: QuizQuestion = {
    ...question,
    id: 'fixture#figure',
    stem: 'Quan sát hình #canvas(length: 1cm, { }) rồi chọn đáp án.',
  };

  const autoSource = buildQuizDocument(figureQuestion, {
    revealAnswer: false,
    showSolution: false,
    fontSize: 36,
  });
  assert.match(autoSource, /quiz-figure\(scale-factor: 120%\)/);

  const manualSource = buildQuizDocument(figureQuestion, {
    revealAnswer: false,
    showSolution: false,
    fontSize: 36,
    figureScaleOverride: 0.8,
  });
  assert.match(manualSource, /quiz-figure\(scale-factor: 80%\)/);
});
