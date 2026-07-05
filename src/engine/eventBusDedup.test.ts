import { describe, expect, it } from 'vitest';
import {
  clearDedupSlots,
  createDedupSlots,
  dedupShouldSuppress,
  hashDedupPayload,
  pruneDedupSlots,
} from './eventBusDedup';

describe('hashDedupPayload', () => {
  it('is stable regardless of object key order', () => {
    const a = hashDedupPayload('quest:update', { questId: 'q1', step: 2 });
    const b = hashDedupPayload('quest:update', { step: 2, questId: 'q1' });
    expect(a).toBe(b);
  });

  it('differs for different primitive values', () => {
    const a = hashDedupPayload('fx:xp_gain', { amount: 10, source: 'quest' });
    const b = hashDedupPayload('fx:xp_gain', { amount: 15, source: 'quest' });
    expect(a).not.toBe(b);
  });

  it('caps string hashing cost for long text fields', () => {
    const a = hashDedupPayload('ui:exploration_message', { text: 'x'.repeat(10_000) });
    const b = hashDedupPayload('ui:exploration_message', { text: 'x'.repeat(20_000) });
    expect(a).not.toBe(b);

    const sameHeadSameLen = hashDedupPayload('ui:exploration_message', {
      text: `${'a'.repeat(48)}tail-one`,
    });
    const sameHeadSameLen2 = hashDedupPayload('ui:exploration_message', {
      text: `${'a'.repeat(48)}tail-two`,
    });
    expect(sameHeadSameLen).toBe(sameHeadSameLen2);
  });

  it('hashes nested-only payloads by field names', () => {
    const a = hashDedupPayload('world:hour_changed', {
      hour: 12,
      npcStates: { a: { x: 1 } },
    });
    const b = hashDedupPayload('world:hour_changed', {
      hour: 12,
      npcStates: { b: { y: 99 } },
    });
    expect(a).toBe(b);
  });

  it('separates nested-only payloads with different field sets', () => {
    const a = hashDedupPayload('evt', { nested: { a: 1 } });
    const b = hashDedupPayload('evt', { other: { a: 1 } });
    expect(a).not.toBe(b);
  });
});

describe('dedupShouldSuppress', () => {
  it('suppresses duplicate hash within window', () => {
    const slots = createDedupSlots();
    const hash = hashDedupPayload('sound:play', { type: 'item_use' });
    const t0 = 1_000;

    expect(dedupShouldSuppress(slots, hash, t0)).toBe(false);
    expect(dedupShouldSuppress(slots, hash, t0 + 100)).toBe(true);
    expect(dedupShouldSuppress(slots, hash, t0 + 600)).toBe(false);
  });

  it('pruneDedupSlots clears expired entries', () => {
    const slots = createDedupSlots();
    const hash = 42;
    dedupShouldSuppress(slots, hash, 1_000);
    pruneDedupSlots(slots, 2_000);
    expect(slots.some((s) => s.hash === hash && s.ts !== 0)).toBe(false);
    clearDedupSlots(slots);
  });
});
