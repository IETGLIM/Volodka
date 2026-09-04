import { describe, expect, it, vi } from 'vitest';
import {
  NPC_FACTION_BARK_CHANCE,
  resolveNpcFactionBark,
} from '@/shared/npcFactionBark';

describe('resolveNpcFactionBark (v4.8.7 фракционные барки)', () => {
  it('returns a line for ally tier with a deterministic rng', () => {
    const line = resolveNpcFactionBark('ally', 'Сеть', vi.fn().mockReturnValue(0.1));
    expect(line).not.toBeNull();
    expect(line).toContain('Сеть');
  });

  it('returns a line for hostile tier', () => {
    const line = resolveNpcFactionBark('hostile', 'Толпа', vi.fn().mockReturnValue(0.1));
    expect(line).not.toBeNull();
    expect(line).toContain('Толпа');
  });

  it('returns null for weak tiers (noise control)', () => {
    for (const tier of ['cordial', 'neutral', 'wary'] as const) {
      expect(resolveNpcFactionBark(tier, 'Сеть', vi.fn().mockReturnValue(0.0))).toBeNull();
    }
  });

  it('returns null when the chance roll fails', () => {
    const allyChance = NPC_FACTION_BARK_CHANCE.ally!;
    expect(
      resolveNpcFactionBark('ally', 'Сеть', vi.fn().mockReturnValue(allyChance + 0.01)),
    ).toBeNull();
  });

  it('replaces the %f placeholder with the faction label', () => {
    for (let i = 0; i < 10; i++) {
      const line = resolveNpcFactionBark('ally', 'Гильдия', vi.fn().mockReturnValue(0.05));
      if (line) {
        expect(line).toContain('Гильдия');
        expect(line).not.toContain('%f');
        return;
      }
    }
    throw new Error('ни одна из 10 попыток не дала барку — шанс сломан');
  });

  it('can produce every template of a tier across many rolls', () => {
    const seen = new Set<string>();
    let seed = 1;
    const rng = () => {
      // Детерминированный LCG — без Math.random тест стабилен.
      seed = (seed * 1664525 + 1013904223) % 4294967296;
      return seed / 4294967296;
    };
    for (let i = 0; i < 4000; i++) {
      const line = resolveNpcFactionBark('hostile', 'Толпа', rng);
      if (line) seen.add(line);
    }
    expect(seen.size).toBeGreaterThanOrEqual(4);
  });
});
