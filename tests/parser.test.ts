import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { test } from 'node:test';
import { parseTypstQuiz } from '../src/parser/typstQuizParser.ts';
import { splitTopLevel } from '../src/parser/scanner.ts';
import { resolveDependency, scanDependencies } from '../src/runtime/dependencyScanner.ts';

async function fixture(name: string): Promise<string> {
  return readFile(new URL(`../fixtures/${name}`, import.meta.url), 'utf8');
}

test('parses MCQ and correct T[] option', async () => {
  const doc = parseTypstQuiz(await fixture('mcq.typ'), 'fixtures/mcq.typ');
  assert.equal(doc.questions.length, 1);
  const q = doc.questions[0]!;
  assert.equal(q.kind, 'mcq');
  assert.equal(q.points, 0.25);
  assert.deepEqual(q.tags, ['0D1N1-5']);
  assert.equal(q.choices.length, 4);
  assert.equal(q.choices.findIndex(c => c.correct), 1);
  assert.match(q.solution ?? '', /Đổi/);
});

test('parses true/false', async () => {
  const doc = parseTypstQuiz(await fixture('true-false.typ'));
  const q = doc.questions[0]!;
  assert.equal(q.kind, 'true-false');
  assert.deepEqual(q.choices.map(c => c.correct), [true, false, true, false]);
});

test('parses short answer', async () => {
  const doc = parseTypstQuiz(await fixture('short-answer.typ'));
  const q = doc.questions[0]!;
  assert.equal(q.kind, 'short-answer');
  assert.equal(q.shortAnswer, '"9"');
});

test('nested commas and macros do not split choice arguments', async () => {
  const doc = parseTypstQuiz(await fixture('combined.typ'));
  assert.equal(doc.questions.length, 3);
  const q = doc.questions[0]!;
  assert.equal(q.choices.length, 4);
  assert.match(q.choices[3]!.raw, /\.at\(0\)/);
  assert.equal(q.choices.findIndex(c => c.correct), 1);
});

test('splitTopLevel preserves nested commas', () => {
  const parts = splitTopLevel('[a, b], T[$x=(1,2)$], [c]');
  assert.equal(parts.length, 3);
});

test('dependency scanner resolves absolute and relative paths', () => {
  const refs = scanDependencies('#import "/de-thi.typ": *\n#image("fig/a.png")');
  assert.equal(refs.length, 2);
  assert.equal(resolveDependency('/Toan10/data/a.typ', refs[0]!.path), '/de-thi.typ');
  assert.equal(resolveDependency('/Toan10/data/a.typ', refs[1]!.path), '/Toan10/data/fig/a.png');
});


test('dependency scanner ignores examples inside comments and strings', () => {
  const source = `
// Cú pháp ví dụ: #immini()[image("hinh.png")]
/* #include "fake.typ" */
#let sample = "image(\\\"also-fake.png\\\")"
#image("real.png")
#import "real.typ": *
`;
  const refs = scanDependencies(source);
  assert.deepEqual(
    refs.map(ref => [ref.kind, ref.path]),
    [
      ['asset', 'real.png'],
      ['source', 'real.typ'],
    ],
  );
});


test('parses Toan12-style answers placed after #ex blocks', async () => {
  const doc = parseTypstQuiz(await fixture('toan12-external-answers.typ'), 'Toan12/dataTN/fixture.typ');

  assert.equal(doc.questions.length, 3);
  assert.deepEqual(doc.questions.map(q => q.kind), ['mcq', 'true-false', 'short-answer']);

  const mcq = doc.questions[0]!;
  assert.equal(mcq.choices.length, 4);
  assert.equal(mcq.choices.findIndex(choice => choice.correct), 1);
  assert.match(mcq.solution ?? '', /Đáp án là/);

  const tf = doc.questions[1]!;
  assert.deepEqual(tf.choices.map(choice => choice.correct), [true, false, true, false]);
  assert.match(tf.solution ?? '', /Kiểm tra từng mệnh đề/);

  const short = doc.questions[2]!;
  assert.equal(short.shortAnswer, '"0,5"');
  assert.match(short.solution ?? '', /Kết quả/);
});

test('still prefers an answer nested inside the #ex body', () => {
  const source = `
#ex[
  Câu có đáp án bên trong.
  #choice([$A$], T[$B$], [$C$], [$D$])
]
#loigiai[Giải.]
`;

  const doc = parseTypstQuiz(source);
  assert.equal(doc.questions[0]!.kind, 'mcq');
  assert.equal(doc.questions[0]!.choices.findIndex(choice => choice.correct), 1);
  assert.equal(doc.questions[0]!.stem.includes('#choice'), false);
});


test('preserves enclosing immini when answer macro is nested inside it', () => {
  const source = `
#ex[
  #immini(img-width: 40%)[
    Câu hỏi có hình.
    #choice([$A$], T[$B$], [$C$], [$D$])
  ][
    #canvas(length: 1cm, { })
  ]
]
#loigiai[Giải.]
`;

  const doc = parseTypstQuiz(source);
  const q = doc.questions[0]!;

  assert.equal(q.kind, 'mcq');
  assert.match(q.stem, /#immini/);
  assert.match(q.stem, /#canvas/);
  assert.equal(q.stem.includes('#choice'), false);
  assert.equal(q.choices.findIndex(choice => choice.correct), 1);
});


test('math primes do not break macro scanning', () => {
  const source = `
#ex[
  Cho hình lập phương $A B C D . A' B' C' D'$. Xét $arrow(B' C)$.
  #align(center)[
    #canvas(length: 0.68cm, {
      let A1 = (0, 3.8)
      let B1 = (-1.3, 2.8)
      point-label("A'", A1)
      point-label("B'", B1)
    })
  ]
]
#choice([$30 degree$], [$45 degree$], T[$60 degree$], [$120 degree$])
#loigiai[
  $(arrow(B D), arrow(B' C)) = 60 degree$.
]

#ex[
  Câu sau vẫn phải được scanner nhìn thấy.
]
#shortanswer("2")
`;

  const doc = parseTypstQuiz(source);
  assert.equal(doc.questions.length, 2);
  assert.equal(doc.questions[0]!.kind, 'mcq');
  assert.equal(doc.questions[1]!.kind, 'short-answer');
  assert.match(doc.questions[0]!.stem, /#canvas/);
});
