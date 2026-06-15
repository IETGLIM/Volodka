import type { SceneId } from '@/shared/types/game';

/** Hero scenes — full AAA visual treatment (post-FX, clutter, wet surfaces). */
export const HERO_SCENE_IDS = [
  'volodka_room',
  'volodka_corridor',
  'home_evening',
  'street_night',
  'cafe_evening',
  'office_day',
  'park_day',
  'library_day',
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
  volodka_room: { ...HERO_PROFILE, enhancedAmbientOcclusion: false },
  volodka_corridor: { ...HERO_PROFILE, enhancedAmbientOcclusion: false },
  home_evening: { ...HERO_PROFILE, enhancedAmbientOcclusion: false },
  street_night: {
    ...HERO_PROFILE,
    enhancedAmbientOcclusion: true,
    bloomIntensityScale: 1.18,
  },
  cafe_evening: { ...HERO_PROFILE, enhancedAmbientOcclusion: false, bloomIntensityScale: 1.15 },
  office_day: { ...HERO_PROFILE, enhancedAmbientOcclusion: false },
  park_day: { ...HERO_PROFILE, enhancedAmbientOcclusion: false, bloomIntensityScale: 1.06 },
  library_day: { ...HERO_PROFILE, enhancedAmbientOcclusion: false },
  rooftop_edge: {
    ...STANDARD_PROFILE,
    forceFullPostFx: true,
    enhancedAmbientOcclusion: false,
    bloomIntensityScale: 1.14,
  },
  abandoned_factory: { ...STANDARD_PROFILE, forceFullPostFx: true, enhancedAmbientOcclusion: false },
  factory_basement: { ...STANDARD_PROFILE, forceFullPostFx: true, enhancedAmbientOcclusion: false },
  zarema_albert_room: { ...STANDARD_PROFILE, forceFullPostFx: true, enhancedAmbientOcclusion: false },
  solnysh_room: { ...STANDARD_PROFILE, forceFullPostFx: true, enhancedAmbientOcclusion: false },
  sleep_dream: {
    ...STANDARD_PROFILE,
    forceFullPostFx: true,
    enhancedAmbientOcclusion: false,
    bloomIntensityScale: 1.12,
  },
};

export function getSceneVisualProfile(sceneId: SceneId): SceneVisualProfile {
  return PROFILES[sceneId] ?? STANDARD_PROFILE;
}

export function isHeroScene(sceneId: SceneId): boolean {
  return getSceneVisualProfile(sceneId).tier === 'hero';
}
