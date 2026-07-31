import { describe, it, expect } from 'vitest';
import { getSceneVisualProfile, isHeroScene, HERO_SCENE_IDS, shouldUseDenseSceneAmbientOcclusion } from '@/config/sceneVisualProfiles';

describe('sceneVisualProfiles', () => {
  it('marks hero scenes with enhanced visual tier', () => {
    for (const sceneId of HERO_SCENE_IDS) {
      expect(isHeroScene(sceneId)).toBe(true);
      expect(getSceneVisualProfile(sceneId).forceFullPostFx).toBe(true);
      // All hero scenes (including park canopy depth) have AO enabled
      expect(getSceneVisualProfile(sceneId).enhancedAmbientOcclusion).toBe(true);
    }
  });

  it('uses standard profile for non-hero scenes', () => {
    const profile = getSceneVisualProfile('factory_basement');
    expect(profile.tier).toBe('standard');
    expect(profile.forceFullPostFx).toBe(true);
    // Indoor standard scenes have AO enabled for visual depth
    expect(profile.enhancedAmbientOcclusion).toBe(true);
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
    const park = getSceneVisualProfile('park_day');
    expect(park.bloomIntensityScale).toBe(1.08);
    expect(park.enhancedAmbientOcclusion).toBe(true);
    expect(park.aoIntensity).toBe(2.2);
  });

  it('boosts interior mood bloom for home, library, office', () => {
    expect(getSceneVisualProfile('home_evening').bloomIntensityScale).toBe(1.08);
    expect(getSceneVisualProfile('library_day').bloomIntensityScale).toBe(1.06);
    expect(getSceneVisualProfile('office_day').bloomIntensityScale).toBe(1.04);
  });

  it('boosts remaining hero and story scene bloom profiles', () => {
    expect(getSceneVisualProfile('volodka_room').bloomIntensityScale).toBe(1.07);
    expect(getSceneVisualProfile('volodka_corridor').bloomIntensityScale).toBe(1.05);
    expect(getSceneVisualProfile('factory_basement').bloomIntensityScale).toBe(1.1);
    expect(getSceneVisualProfile('street_winter').bloomIntensityScale).toBe(1.04);
    expect(getSceneVisualProfile('zarema_albert_room').bloomIntensityScale).toBe(1.05);
    expect(getSceneVisualProfile('abandoned_factory').bloomIntensityScale).toBe(1.06);
  });

  it('promotes city_square to hero outdoor parity with street_night', () => {
    expect(isHeroScene('city_square')).toBe(true);
    const profile = getSceneVisualProfile('city_square');
    expect(profile.tier).toBe('hero');
    expect(profile.forceFullPostFx).toBe(true);
    expect(profile.enhancedAmbientOcclusion).toBe(true);
    expect(profile.bloomIntensityScale).toBe(1.18);
    expect(profile.shadowMapScale).toBe(1.2);
  });

  it('boosts pier hubs toward street/plaza shadow + NPC LOD parity', () => {
    for (const sceneId of ['river_pier', 'pier_evening'] as const) {
      const profile = getSceneVisualProfile(sceneId);
      expect(profile.forceFullPostFx).toBe(true);
      expect(profile.enhancedAmbientOcclusion).toBe(true);
      expect(profile.shadowMapScale).toBe(1.15);
      expect(profile.ambientNpcCountBoost).toBe(1);
      expect(profile.npcLodDistanceScale).toBe(1.1);
    }
  });

  it('thickens factory_roof industrial dusk cues', () => {
    const profile = getSceneVisualProfile('factory_roof');
    expect(profile.forceFullPostFx).toBe(true);
    expect(profile.enhancedAmbientOcclusion).toBe(true);
    expect(profile.shadowMapScale).toBe(1.12);
    expect(profile.bloomIntensityScale).toBe(1.14);
    expect(profile.npcLodDistanceScale).toBe(1.1);
  });

  it('grounds abandoned_factory bunker-approach shadows', () => {
    expect(getSceneVisualProfile('abandoned_factory').shadowMapScale).toBe(1.1);
  });

  it('drops dense industrial N8AO under soft-work budget pressure', () => {
    expect(shouldUseDenseSceneAmbientOcclusion('guild_mainframe', true)).toBe(true);
    expect(shouldUseDenseSceneAmbientOcclusion('guild_mainframe', false)).toBe(false);
    expect(shouldUseDenseSceneAmbientOcclusion('factory_roof', false)).toBe(false);
    expect(shouldUseDenseSceneAmbientOcclusion('volodka_room', false)).toBe(true);
  });
});
