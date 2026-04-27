import { describe, expect, it } from 'vitest';
import { explorationAmbientWithIbl, getExplorationIblProfile } from './explorationIblProfiles';

describe('getExplorationIblProfile', () => {
  it('отключает IBL при visualLite', () => {
    expect(
      getExplorationIblProfile({
        sceneId: 'volodka_room',
        visualLite: true,
        introCutsceneActive: false,
      }).preset,
    ).toBeNull();
  });

  it('отключает IBL в intro', () => {
    expect(
      getExplorationIblProfile({
        sceneId: 'mvd',
        visualLite: false,
        introCutsceneActive: true,
      }).preset,
    ).toBeNull();
  });

  it('выдаёт city для district / mvd', () => {
    const a = getExplorationIblProfile({
      sceneId: 'district',
      visualLite: false,
      introCutsceneActive: false,
    });
    const b = getExplorationIblProfile({
      sceneId: 'mvd',
      visualLite: false,
      introCutsceneActive: false,
    });
    expect(a.preset).toBe('city');
    expect(b.preset).toBe('city');
    expect(a.environmentIntensity).toBeGreaterThan(0);
  });
});

describe('explorationAmbientWithIbl', () => {
  it('снижает fill при активном IBL', () => {
    const raw = 0.5 + 0.3;
    const m = explorationAmbientWithIbl(raw, true);
    expect(m).toBeLessThan(raw);
  });
});
