import { describe, expect, it } from 'vitest';
import { formatNpcActivityHint } from '@/engine/npc/npcActivityPresentation';

describe('formatNpcActivityHint', () => {
  it('maps known activities to Russian hints', () => {
    expect(formatNpcActivityHint('walk')).toBe('Идёт по делам');
    expect(formatNpcActivityHint('sleep')).toContain('Спит');
  });

  it('returns undefined for unknown activity', () => {
    expect(formatNpcActivityHint('dance')).toBeUndefined();
  });
});
