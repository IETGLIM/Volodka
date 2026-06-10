/* ─── Shared distance LOD thresholds (hysteresis) ─── */

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

/** Scale thresholds — lower bias = keep high detail longer (ultra preset). */
export function scaleNpcLodThresholds(base: LodThresholds, lodBias: number): LodThresholds {
  const inv = 1 / Math.max(lodBias, 0.25);
  return {
    cullOut: base.cullOut * inv,
    cullIn: base.cullIn * inv,
    impostorOut: base.impostorOut * inv,
    impostorIn: base.impostorIn * inv,
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

const DEFAULT_ENV_PROFILE: EnvironmentLodProfile = {
  clutterDistance: 999,
  decorativeDistance: 999,
};

export const SCENE_ENV_LOD: Partial<Record<string, EnvironmentLodProfile>> = {
  street_night: { clutterDistance: 16, decorativeDistance: 24 },
  street_winter: { clutterDistance: 16, decorativeDistance: 24 },
  abandoned_factory: { clutterDistance: 12, decorativeDistance: 18 },
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
  /** Dense forest — aggressive cull for draw-call budget (400 max) */
  chk_forest_zorge: { clutterDistance: 12, decorativeDistance: 18 },
};

/** Per-scene NPC LOD — tighter thresholds for worst draw-call offenders. */
export const SCENE_NPC_LOD: Partial<Record<string, LodThresholds>> = {
  abandoned_factory: { cullOut: 28, cullIn: 24, impostorOut: 14, impostorIn: 9 },
  chk_forest_zorge: { cullOut: 26, cullIn: 22, impostorOut: 13, impostorIn: 8 },
};

export function getNpcLodThresholds(sceneId: string, base: LodThresholds = DEFAULT_NPC_LOD): LodThresholds {
  return SCENE_NPC_LOD[sceneId] ?? base;
}

export function getEnvironmentLodProfile(sceneId: string): EnvironmentLodProfile {
  return SCENE_ENV_LOD[sceneId] ?? DEFAULT_ENV_PROFILE;
}

export function environmentLodFromDistance(
  distance: number,
  profile: EnvironmentLodProfile,
  lodBias: number,
): EnvironmentLodLevel {
  const clutter = profile.clutterDistance / Math.max(lodBias, 0.25);
  const decorative = profile.decorativeDistance / Math.max(lodBias, 0.25);

  if (distance <= clutter) return 'full';
  if (distance <= decorative) return 'standard';
  return 'minimal';
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
