import { describe, it, expect } from 'vitest';
import { getSceneVisualProfile, isHeroScene, HERO_SCENE_IDS } from '@/config/sceneVisualProfiles';

describe('sceneVisualProfiles', () => {
  it('marks hero scenes with enhanced visual tier', () => {
    for (const sceneId of HERO_SCENE_IDS) {
      expect(isHeroScene(sceneId)).toBe(true);
      expect(getSceneVisualProfile(sceneId).forceFullPostFx).toBe(true);
      // Hero profiles disable N8AO by default — full post-FX without SS AO cost.
      expect(getSceneVisualProfile(sceneId).enhancedAmbientOcclusion).toBe(false);
    }
  });

  it('uses standard profile for non-hero scenes', () => {
    const profile = getSceneVisualProfile('factory_basement');
    expect(profile.tier).toBe('standard');
    expect(profile.forceFullPostFx).toBe(true);
  });
});
