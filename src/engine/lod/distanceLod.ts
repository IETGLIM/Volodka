/* ─── Shared distance LOD thresholds (hysteresis) ─── */

import { getSceneVisualProfile } from '@/config/sceneVisualProfiles';
import { resolveDerivedSceneId } from '@/config/sceneInheritance';
import type { SceneId } from '@/shared/types/game';

/** NPC visual tiers */
export type NpcLodLevel = 'culled' | 'impostor' | 'full';

/** Environment decoration tiers */
export type EnvironmentLodLevel = 'minimal' | 'standard' | 'full';

export interface LodThresholds {
  /** Distance above which NPC is fully hidden */
  cullOut: number;
  /** Distance below which culled NPC becomes visible again */
  cullIn: number;
  /** Distance above which full model downgrades to impostor */
  impostorOut: number;
  /** Distance below which impostor upgrades to full model */
  impostorIn: number;
}

export const DEFAULT_NPC_LOD: LodThresholds = {
  cullOut: 32,
  cullIn: 28,
  impostorOut: 17,
  impostorIn: 11,
};

/** Scale thresholds — lower lodBias switches to low detail sooner. */
export function scaleNpcLodThresholds(base: LodThresholds, lodBias: number): LodThresholds {
  const scale = Math.max(lodBias, 0.25);
  return {
    cullOut: base.cullOut * scale,
    cullIn: base.cullIn * scale,
    impostorOut: base.impostorOut * scale,
    impostorIn: base.impostorIn * scale,
  };
}

/** Resolve NPC LOD with hysteresis to avoid flicker at boundaries. */
export function resolveNpcLod(
  distance: number,
  current: NpcLodLevel,
  thresholds: LodThresholds = DEFAULT_NPC_LOD,
  forceFull = false,
): NpcLodLevel {
  if (forceFull) return 'full';

  switch (current) {
    case 'culled':
      if (distance < thresholds.cullIn) {
        return distance < thresholds.impostorIn ? 'full' : 'impostor';
      }
      return 'culled';
    case 'impostor':
      if (distance >= thresholds.cullOut) return 'culled';
      if (distance < thresholds.impostorIn) return 'full';
      return 'impostor';
    case 'full':
    default:
      if (distance >= thresholds.cullOut) return 'culled';
      if (distance >= thresholds.impostorOut) return 'impostor';
      return 'full';
  }
}

export interface EnvironmentLodProfile {
  /** Hide clutter props beyond this distance from the prop anchor */
  clutterDistance: number;
  /** Hide heavy decorative props beyond this distance */
  decorativeDistance: number;
}

/** Per-tier enter/exit distances for environment LOD hysteresis (world units). */
export interface EnvironmentLodThresholds {
  /** Distance above which full detail downgrades to standard */
  clutterOut: number;
  /** Distance below which standard upgrades back to full */
  clutterIn: number;
  /** Distance above which standard downgrades to minimal */
  decorativeOut: number;
  /** Distance below which minimal upgrades back to standard */
  decorativeIn: number;
}

/** Upgrade band ratio — matches NPC cullIn/cullOut spacing (~15%). */
export const ENV_LOD_HYSTERESIS_IN_RATIO = 0.85;

const DEFAULT_ENV_PROFILE: EnvironmentLodProfile = {
  clutterDistance: 999,
  decorativeDistance: 999,
};

export const SCENE_ENV_LOD: Partial<Record<string, EnvironmentLodProfile>> = {
  street_night: { clutterDistance: 16, decorativeDistance: 24 },
  street_winter: { clutterDistance: 16, decorativeDistance: 24 },
  abandoned_factory: { clutterDistance: 14, decorativeDistance: 20 },
  park_day: { clutterDistance: 18, decorativeDistance: 28 },
  office_day: { clutterDistance: 12, decorativeDistance: 18 },
  cafe_evening: { clutterDistance: 10, decorativeDistance: 14 },
  volodka_room: { clutterDistance: 8, decorativeDistance: 10 },
  volodka_corridor: { clutterDistance: 10, decorativeDistance: 14 },
  home_evening: { clutterDistance: 10, decorativeDistance: 14 },
  library_day: { clutterDistance: 14, decorativeDistance: 22 },
  rooftop_edge: { clutterDistance: 12, decorativeDistance: 18 },
  sleep_dream: { clutterDistance: 20, decorativeDistance: 30 },
  battle: { clutterDistance: 10, decorativeDistance: 14 },
  zarema_albert_room: { clutterDistance: 8, decorativeDistance: 12 },
  solnysh_room: { clutterDistance: 8, decorativeDistance: 12 },
  factory_basement: { clutterDistance: 10, decorativeDistance: 14 },
  chk_campfire_night: { clutterDistance: 14, decorativeDistance: 20 },
  city_square: { clutterDistance: 16, decorativeDistance: 24 },
  pier_evening: { clutterDistance: 14, decorativeDistance: 22 },
  factory_roof: { clutterDistance: 12, decorativeDistance: 18 },
  library_basement: { clutterDistance: 12, decorativeDistance: 18 },
  underground_bunker: { clutterDistance: 10, decorativeDistance: 14 },
  guild_mainframe: { clutterDistance: 8, decorativeDistance: 12 },
  zarema_room: { clutterDistance: 8, decorativeDistance: 10 },
  albert_backroom: { clutterDistance: 6, decorativeDistance: 9 },
  river_pier: { clutterDistance: 14, decorativeDistance: 22 },
  chk_forest_zorge: { clutterDistance: 14, decorativeDistance: 20 },
};

export function getEnvironmentLodProfile(sceneId: string): EnvironmentLodProfile {
  const visualId = resolveDerivedSceneId(sceneId as SceneId);
  const base = SCENE_ENV_LOD[sceneId] ?? SCENE_ENV_LOD[visualId] ?? DEFAULT_ENV_PROFILE;
  const scale = getSceneVisualProfile(sceneId as SceneId).detailDistanceScale;
  return {
    clutterDistance: base.clutterDistance * scale,
    decorativeDistance: base.decorativeDistance * scale,
  };
}

export function environmentLodThresholdsFromProfile(
  profile: EnvironmentLodProfile,
  lodBias: number,
): EnvironmentLodThresholds {
  const scale = Math.max(lodBias, 0.25);
  const clutterOut = profile.clutterDistance * scale;
  const decorativeOut = profile.decorativeDistance * scale;
  return {
    clutterOut,
    clutterIn: clutterOut * ENV_LOD_HYSTERESIS_IN_RATIO,
    decorativeOut,
    decorativeIn: decorativeOut * ENV_LOD_HYSTERESIS_IN_RATIO,
  };
}

/** One-shot tier pick (no hysteresis) — used by tests and legacy callers. */
export function environmentLodFromDistance(
  distance: number,
  profile: EnvironmentLodProfile,
  lodBias: number,
): EnvironmentLodLevel {
  const { clutterOut, decorativeOut } = environmentLodThresholdsFromProfile(profile, lodBias);
  if (distance <= clutterOut) return 'full';
  if (distance <= decorativeOut) return 'standard';
  return 'minimal';
}

/** Resolve environment LOD with hysteresis to avoid flicker at tier boundaries. */
export function resolveEnvironmentLod(
  distance: number,
  current: EnvironmentLodLevel,
  thresholds: EnvironmentLodThresholds,
): EnvironmentLodLevel {
  switch (current) {
    case 'minimal':
      if (distance < thresholds.decorativeIn) {
        return distance < thresholds.clutterIn ? 'full' : 'standard';
      }
      return 'minimal';
    case 'standard':
      if (distance >= thresholds.decorativeOut) return 'minimal';
      if (distance < thresholds.clutterIn) return 'full';
      return 'standard';
    case 'full':
      if (distance >= thresholds.decorativeOut) return 'minimal';
      if (distance >= thresholds.clutterOut) return 'standard';
      return 'full';
    default: {
      const _exhaustive: never = current;
      return _exhaustive;
    }
  }
}

export function environmentDetailVisible(
  required: EnvironmentLodLevel,
  current: EnvironmentLodLevel,
): boolean {
  const rank: Record<EnvironmentLodLevel, number> = {
    minimal: 0,
    standard: 1,
    full: 2,
  };
  return rank[current] >= rank[required];
}
