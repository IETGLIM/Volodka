import { describe, expect, it, beforeEach } from 'vitest';
import {
  __markFpsFailForTests,
  __resetSoftWorkBudgetForTests,
  isSoftWorkAffordable,
  isUltra2048Affordable,
} from './softWorkBudget';

describe('softWorkBudget', () => {
  beforeEach(() => {
    __resetSoftWorkBudgetForTests();
  });

  it('allows soft work by default', () => {
    expect(isSoftWorkAffordable()).toBe(true);
  });

  it('blocks soft work after recent FPS fail', () => {
    __markFpsFailForTests(performance.now());
    expect(isSoftWorkAffordable()).toBe(false);
  });

  it('requires opt-in for Ultra 2048 when window/localStorage exist', () => {
    expect(isUltra2048Affordable()).toBe(false);
    if (typeof globalThis.window === 'undefined' || !globalThis.window?.localStorage) {
      // Node unit env — affordability stays false without browser storage
      return;
    }
    globalThis.window.localStorage.setItem('volodka.ultra2048', '1');
    expect(isUltra2048Affordable()).toBe(true);
    globalThis.window.localStorage.removeItem('volodka.ultra2048');
  });
});
