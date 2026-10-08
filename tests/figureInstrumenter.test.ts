import assert from 'node:assert/strict';
import { test } from 'node:test';
import { instrumentFigures, resolveFigureScale } from '../src/runtime/figureInstrumenter.ts';

test('auto figure scale follows font size with safe clamps', () => {
  assert.equal(resolveFigureScale(30), 1);
  assert.equal(resolveFigureScale(36), 1.2);
  assert.equal(resolveFigureScale(21), 0.7);
  assert.equal(resolveFigureScale(60), 2);
  assert.equal(resolveFigureScale(72), 2);
});

test('manual figure scale overrides auto mode', () => {
  assert.equal(resolveFigureScale(20, 1.4), 1.4);
  assert.equal(resolveFigureScale(50, 0.8), 0.8);
  assert.equal(resolveFigureScale(30, 2), 2);
  assert.equal(resolveFigureScale(30, 2.5), 2);
});

test('wraps standalone canvas as a clickable scalable figure', () => {
  const source = 'Đề bài. #canvas(length: 1cm, { })';
  const out = instrumentFigures(source, 1.2);

  assert.match(out, /#quiz-figure\(scale-factor: 120%\)\[#canvas/);
});

test('wraps the immini figure body once without double-wrapping nested canvas', () => {
  const source = `
#immini(img-width: 40%)[
  Nội dung.
][
  #align(center)[#canvas(length: 1cm, { })]
]
`;
  const out = instrumentFigures(source, 1.4);

  assert.equal((out.match(/#quiz-figure/g) ?? []).length, 1);
  assert.match(out, /#quiz-figure\(scale-factor: 140%\)/);
  assert.match(out, /#canvas\(length: 1cm/);
});
