import { describe, expect, it } from 'vitest';
import { composeNpcFitScale, resolveNpcSilhouetteScale } from './npcSilhouetteVariance';
import type { NPCAppearance } from '@/shared/types/definitions/npc';

const base: NPCAppearance = {
  bodyColor: '#222',
  accentColor: '#444',
  headAccessory: 'glasses',
  height: 1.05,
  glowColor: '#0ff',
  silhouette: 'slim',
};

describe('npcSilhouetteVariance', () => {
  it('slim is narrower than heavy', () => {
    const slim = resolveNpcSilhouetteScale({ ...base, silhouette: 'slim' });
    const heavy = resolveNpcSilhouetteScale({ ...base, silhouette: 'heavy' });
    expect(slim[0]).toBeLessThan(heavy[0]);
    expect(slim[2]).toBeLessThan(heavy[2]);
  });

  it('composes fit scale with height on Y', () => {
    const [x, y, z] = composeNpcFitScale(2, base);
    expect(y).toBeCloseTo(2 * 1.05);
    expect(x).toBeLessThan(2);
    expect(z).toBeLessThan(2);
  });
});
