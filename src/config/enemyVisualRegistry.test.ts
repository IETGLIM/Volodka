import { describe, expect, it } from 'vitest';
import { ENEMY_TYPE_IDS } from '@/data/enemyTypeIds';
import {
  getEnemyVisualArchetype,
  resolveEnemyVisualSpec,
} from '@/config/enemyVisualRegistry';

describe('enemyVisualRegistry', () => {
  it('covers all canonical enemy types', () => {
    for (const enemyType of ENEMY_TYPE_IDS) {
      const spec = resolveEnemyVisualSpec(enemyType);
      expect(spec.archetype).toBeTruthy();
      expect(spec.scale).toBeGreaterThan(0);
      expect(getEnemyVisualArchetype(enemyType)).toBe(spec.archetype);
    }
  });
});
