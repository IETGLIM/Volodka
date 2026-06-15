import { describe, it, expect } from 'vitest';
import { getSceneVisualProfile, isHeroScene, HERO_SCENE_IDS } from '@/config/sceneVisualProfiles';

describe('sceneVisualProfiles', () => {
  it('marks hero scenes with enhanced visual tier', () => {
    for (const sceneId of HERO_SCENE_IDS) {
      expect(isHeroScene(sceneId)).toBe(true);
      expect(getSceneVisualProfile(sceneId).forceFullPostFx).toBe(true);
      const aoEnabled = sceneId === 'street_night';
      expect(getSceneVisualProfile(sceneId).enhancedAmbientOcclusion).toBe(aoEnabled);
    }
  });

  it('uses standard profile for non-hero scenes', () => {
    const profile = getSceneVisualProfile('factory_basement');
    expect(profile.tier).toBe('standard');
    expect(profile.forceFullPostFx).toBe(true);
  });

  it('boosts dream bloom for galaxy sky mood', () => {
    expect(getSceneVisualProfile('sleep_dream').bloomIntensityScale).toBe(1.12);
  });

  it('boosts rooftop sunset bloom and keeps full post-FX', () => {
    const profile = getSceneVisualProfile('rooftop_edge');
    expect(profile.bloomIntensityScale).toBe(1.14);
    expect(profile.forceFullPostFx).toBe(true);
  });

  it('boosts park haze bloom on hero tier', () => {
    expect(getSceneVisualProfile('park_day').bloomIntensityScale).toBe(1.06);
  });

  it('boosts interior mood bloom for home, library, office', () => {
    expect(getSceneVisualProfile('home_evening').bloomIntensityScale).toBe(1.08);
    expect(getSceneVisualProfile('library_day').bloomIntensityScale).toBe(1.05);
    expect(getSceneVisualProfile('office_day').bloomIntensityScale).toBe(1.04);
  });
});
