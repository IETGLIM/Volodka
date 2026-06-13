import { describe, it, expect } from 'vitest';
import { getSceneVisualProfile, isHeroScene, HERO_SCENE_IDS } from '@/config/sceneVisualProfiles';

describe('sceneVisualProfiles', () => {
  it('marks hero scenes with enhanced visual tier', () => {
    for (const sceneId of HERO_SCENE_IDS) {
      expect(isHeroScene(sceneId)).toBe(true);
      expect(getSceneVisualProfile(sceneId).forceFullPostFx).toBe(true);
      expect(getSceneVisualProfile(sceneId).enhancedAmbientOcclusion).toBe(true);
    }
  });

  it('uses standard profile for non-hero scenes', () => {
    const profile = getSceneVisualProfile('park_day');
    expect(profile.tier).toBe('standard');
    expect(profile.forceFullPostFx).toBe(false);
  });
});
