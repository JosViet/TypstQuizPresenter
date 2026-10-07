import assert from 'node:assert/strict';
import { test } from 'node:test';
import { shouldOfferFullscreenRecovery } from '../src/presenter/presentationLifecycle.ts';

test('fullscreen recovery is offered only after a presentation fullscreen was lost', () => {
  assert.equal(shouldOfferFullscreenRecovery({
    presentationMode: true,
    standalone: false,
    fullscreenWasActive: true,
    hasFullscreenElement: false,
    visible: true,
  }), true);

  assert.equal(shouldOfferFullscreenRecovery({
    presentationMode: false,
    standalone: false,
    fullscreenWasActive: true,
    hasFullscreenElement: false,
    visible: true,
  }), false);

  assert.equal(shouldOfferFullscreenRecovery({
    presentationMode: true,
    standalone: true,
    fullscreenWasActive: true,
    hasFullscreenElement: false,
    visible: true,
  }), false);

  assert.equal(shouldOfferFullscreenRecovery({
    presentationMode: true,
    standalone: false,
    fullscreenWasActive: false,
    hasFullscreenElement: false,
    visible: true,
  }), false);

  assert.equal(shouldOfferFullscreenRecovery({
    presentationMode: true,
    standalone: false,
    fullscreenWasActive: true,
    hasFullscreenElement: true,
    visible: true,
  }), false);

  assert.equal(shouldOfferFullscreenRecovery({
    presentationMode: true,
    standalone: false,
    fullscreenWasActive: true,
    hasFullscreenElement: false,
    visible: false,
  }), false);
});
