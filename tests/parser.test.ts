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
