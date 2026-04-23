import { describe, expect, it } from 'vitest';
import {
  applyExplorationPlayerGlobalVisualScale,
  EXPLORATION_PLAYER_GLOBAL_VISUAL_SCALE,
  PLAYER_GLB_VISUAL_UNIFORM_MAX,
  PLAYER_GLB_VISUAL_UNIFORM_MIN,
} from '@/lib/playerScaleConstants';

describe('applyExplorationPlayerGlobalVisualScale', () => {
  it('глобальный множитель обхода = 1/5', () => {
    expect(EXPLORATION_PLAYER_GLOBAL_VISUAL_SCALE).toBe(0.2);
  });

  it('умножает на EXPLORATION_PLAYER_GLOBAL_VISUAL_SCALE и reclamp', () => {
    const raw = 0.4;
    const u = applyExplorationPlayerGlobalVisualScale(raw);
    expect(u).toBeCloseTo(raw * EXPLORATION_PLAYER_GLOBAL_VISUAL_SCALE, 5);
    expect(u).toBeGreaterThanOrEqual(PLAYER_GLB_VISUAL_UNIFORM_MIN);
    expect(u).toBeLessThanOrEqual(PLAYER_GLB_VISUAL_UNIFORM_MAX);
  });

  it('возвращает MIN при нечисловом входе', () => {
    expect(applyExplorationPlayerGlobalVisualScale(NaN)).toBe(PLAYER_GLB_VISUAL_UNIFORM_MIN);
  });
});
