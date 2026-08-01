import type { SceneId } from '@/shared/types/game';

/** Hero scenes — full AAA visual treatment (post-FX, clutter, wet surfaces). */
export const HERO_SCENE_IDS = [
  'volodka_room',
  'volodka_corridor',
  'home_evening',
  'street_night',
  'city_square',
  'cafe_evening',
  'office_day',
  'park_day',
  'library_day',
  'procedural_aaa',
] as const satisfies readonly SceneId[];

export type HeroSceneId = (typeof HERO_SCENE_IDS)[number];

export interface SceneVisualProfile {
  tier: 'hero' | 'standard';
  /** Prefer full post-FX pipeline even on mid-tier GPUs (unless visualLite). */
  forceFullPostFx: boolean;
  /** Enable N8AO on high/ultra preset for this scene. */
  enhancedAmbientOcclusion: boolean;
  /** Clutter/decorative prop visibility multiplier (>1 = see detail farther). */
  detailDistanceScale: number;
  /** Multiplier on scene bloom intensity (hero neon scenes). */
  bloomIntensityScale?: number;
  /** N8AO intensity override. */
  aoIntensity?: number;
  /** N8AO sample radius override. */
  aoRadius?: number;
  /** Shadow map resolution scale (Lighting). */
  shadowMapScale?: number;
  /** Extra ambient background NPCs on hero districts. */
  ambientNpcCountBoost?: number;
  /** Keep all EnvironmentalAnimations entries regardless of GPU tier. */
  envAnimationKeepAll?: boolean;
  /** NPC LOD distance multiplier (>1 = full detail from farther away). */
  npcLodDistanceScale?: number;
}

const HERO_PROFILE: SceneVisualProfile = {
  tier: 'hero',
  forceFullPostFx: true,
  enhancedAmbientOcclusion: true,
  detailDistanceScale: 1.15,
  ambientNpcCountBoost: 0,
  envAnimationKeepAll: true,
  npcLodDistanceScale: 1.12,
};

const STANDARD_PROFILE: SceneVisualProfile = {
  tier: 'standard',
  forceFullPostFx: false,
  enhancedAmbientOcclusion: false,
  detailDistanceScale: 1,
};

const PROFILES: Partial<Record<SceneId, SceneVisualProfile>> = {
  volodka_room: { ...HERO_PROFILE, enhancedAmbientOcclusion: true, bloomIntensityScale: 1.07 },
  volodka_corridor: { ...HERO_PROFILE, enhancedAmbientOcclusion: true, aoIntensity: 2.8, aoRadius: 0.55, bloomIntensityScale: 1.05 },
  home_evening: { ...HERO_PROFILE, enhancedAmbientOcclusion: true, bloomIntensityScale: 1.08 },
  street_night: {
    ...HERO_PROFILE,
    enhancedAmbientOcclusion: true,
    bloomIntensityScale: 1.06,
    aoIntensity: 2.45,
    aoRadius: 0.5,
    shadowMapScale: 1.1,
    ambientNpcCountBoost: 1,
    npcLodDistanceScale: 1.12,
  },
  procedural_aaa: {
    ...HERO_PROFILE,
    enhancedAmbientOcclusion: true,
    bloomIntensityScale: 1.12,
    aoIntensity: 2.6,
    aoRadius: 0.55,
  },
  cafe_evening: { ...HERO_PROFILE, enhancedAmbientOcclusion: true, bloomIntensityScale: 1.1 },
  office_day: { ...HERO_PROFILE, enhancedAmbientOcclusion: true, bloomIntensityScale: 1.04 },
  park_day: {
    ...HERO_PROFILE,
    enhancedAmbientOcclusion: true,
    aoIntensity: 2.2,
    aoRadius: 0.55,
    bloomIntensityScale: 1.08,
  },
  library_day: { ...HERO_PROFILE, enhancedAmbientOcclusion: true, bloomIntensityScale: 1.06, aoIntensity: 2.5, aoRadius: 0.52 },
  rooftop_edge: {
    ...STANDARD_PROFILE,
    forceFullPostFx: true,
    enhancedAmbientOcclusion: false,
    bloomIntensityScale: 1.14,
  },
  abandoned_factory: {
    ...STANDARD_PROFILE,
    forceFullPostFx: true,
    enhancedAmbientOcclusion: true,
    aoIntensity: 2.5,
    aoRadius: 0.55,
    bloomIntensityScale: 1.08,
    shadowMapScale: 1.1,
    ambientNpcCountBoost: 1,
    npcLodDistanceScale: 1.08,
  },
  factory_basement: { ...STANDARD_PROFILE, forceFullPostFx: true, enhancedAmbientOcclusion: true, aoIntensity: 3.0, aoRadius: 0.6, bloomIntensityScale: 1.1 },
  zarema_albert_room: { ...STANDARD_PROFILE, forceFullPostFx: true, enhancedAmbientOcclusion: true, aoIntensity: 2.6, aoRadius: 0.5, bloomIntensityScale: 1.05 },
  street_winter: { ...STANDARD_PROFILE, forceFullPostFx: true, enhancedAmbientOcclusion: false, bloomIntensityScale: 1.04 },
  solnysh_room: { ...STANDARD_PROFILE, forceFullPostFx: true, enhancedAmbientOcclusion: true, aoIntensity: 2.6, aoRadius: 0.5 },
  sleep_dream: {
    ...STANDARD_PROFILE,
    forceFullPostFx: true,
    enhancedAmbientOcclusion: false,
    bloomIntensityScale: 1.12,
  },
  // Thin / extension scenes — promote to hero PostFX parity so neon/bloom aren't DEFAULT-flat
  river_pier: {
    ...STANDARD_PROFILE,
    forceFullPostFx: true,
    bloomIntensityScale: 1.14,
    enhancedAmbientOcclusion: true,
    aoIntensity: 2.4,
    aoRadius: 0.48,
    shadowMapScale: 1.15,
    ambientNpcCountBoost: 1,
    npcLodDistanceScale: 1.1,
  },
  pier_evening: {
    ...STANDARD_PROFILE,
    forceFullPostFx: true,
    bloomIntensityScale: 1.16,
    enhancedAmbientOcclusion: true,
    aoIntensity: 2.5,
    aoRadius: 0.5,
    shadowMapScale: 1.15,
    ambientNpcCountBoost: 1,
    npcLodDistanceScale: 1.1,
  },
  chk_forest_zorge: { ...STANDARD_PROFILE, forceFullPostFx: true, bloomIntensityScale: 1.1 },
  chk_campfire_night: {
    ...STANDARD_PROFILE,
    forceFullPostFx: true,
    bloomIntensityScale: 1.14,
    ambientNpcCountBoost: 1,
  },
  factory_roof: {
    ...STANDARD_PROFILE,
    forceFullPostFx: true,
    bloomIntensityScale: 1.14,
    enhancedAmbientOcclusion: true,
    aoIntensity: 2.3,
    aoRadius: 0.48,
    shadowMapScale: 1.12,
    ambientNpcCountBoost: 1,
    npcLodDistanceScale: 1.1,
  },
  city_square: {
    ...HERO_PROFILE,
    enhancedAmbientOcclusion: true,
    bloomIntensityScale: 1.08,
    ambientNpcCountBoost: 2,
    aoIntensity: 2.5,
    aoRadius: 0.5,
    shadowMapScale: 1.15,
    npcLodDistanceScale: 1.15,
  },
  // Extension indoor scenes — AO adds depth to enclosed spaces
  guild_mainframe: { ...STANDARD_PROFILE, forceFullPostFx: true, enhancedAmbientOcclusion: true, aoIntensity: 2.4, aoRadius: 0.5, bloomIntensityScale: 1.06 },
  albert_backroom: { ...STANDARD_PROFILE, forceFullPostFx: true, enhancedAmbientOcclusion: true, aoIntensity: 2.6, aoRadius: 0.5, bloomIntensityScale: 1.05 },
  zarema_room: { ...STANDARD_PROFILE, forceFullPostFx: true, enhancedAmbientOcclusion: true, aoIntensity: 2.6, aoRadius: 0.5, bloomIntensityScale: 1.05 },
  library_basement: { ...STANDARD_PROFILE, forceFullPostFx: true, enhancedAmbientOcclusion: true, aoIntensity: 2.8, aoRadius: 0.55, bloomIntensityScale: 1.04 },
  underground_bunker: {
    ...STANDARD_PROFILE,
    forceFullPostFx: true,
    enhancedAmbientOcclusion: true,
    aoIntensity: 2.8,
    aoRadius: 0.55,
    bloomIntensityScale: 1.1,
  },
};

export function getSceneVisualProfile(sceneId: SceneId): SceneVisualProfile {
  return PROFILES[sceneId] ?? STANDARD_PROFILE;
}

export function isHeroScene(sceneId: SceneId): boolean {
  return getSceneVisualProfile(sceneId).tier === 'hero';
}

/** Dense industrial hero-adjacent scenes — N8AO drops under soft-work budget pressure. */
export const DENSE_INDUSTRIAL_SCENE_IDS = new Set<SceneId>([
  'guild_mainframe',
  'factory_basement',
  'abandoned_factory',
  'factory_roof',
]);

export function shouldUseDenseSceneAmbientOcclusion(
  sceneId: SceneId,
  softWorkAffordable: boolean,
): boolean {
  if (softWorkAffordable) return true;
  return !DENSE_INDUSTRIAL_SCENE_IDS.has(sceneId);
}
