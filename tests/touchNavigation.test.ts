import assert from 'node:assert/strict';
import { test } from 'node:test';
import { swipeDirection } from '../src/presenter/touchNavigation.ts';

test('horizontal swipe changes question', () => {
  assert.equal(swipeDirection(-120, 20), 'next');
  assert.equal(swipeDirection(120, -18), 'previous');
});

test('short or mostly vertical gestures are ignored', () => {
  assert.equal(swipeDirection(40, 2), undefined);
  assert.equal(swipeDirection(100, 90), undefined);
});
