/* ─── Animation LOD for skinned NPCs: throttled mixer + shadow gating ─── */

/**
 * Animation tiers for NPCs already at 'full' VISUAL LOD (full model mounted
 * and visible). The dominant per-frame cost of a skinned character is
 * `mixer.update` (bone pose recomputation), not triangle count — so instead
 * of geometric LODs (retired in v4.7.1: rigs are already low-poly and
 * gltf-transform simplify fails on multi-part skinned meshes) the mixer is
 * refreshed less often as the NPC gets farther from the player.
 *
 * Animation TIME stays exact: the real frame delta accumulates in a ref and
 * is flushed on refresh frames, so throttled animations keep correct speed —
 * only pose smoothness degrades, which is imperceptible beyond ~9 m.
 */
export type NpcAnimationLodLevel = 'full' | 'reduced' | 'minimal';

export interface NpcAnimationLodThresholds {
  /** Distance above which animation downgrades from full rate to reduced. */
  reducedOut: number;
  /** Distance below which reduced upgrades back to full. */
  reducedIn: number;
  /** Distance above which animation downgrades to minimal. */
  minimalOut: number;
  /** Distance below which minimal upgrades back to reduced. */
  minimalIn: number;
  /** Distance above which the full model stops casting real shadows. */
  shadowOut: number;
  /** Distance below which shadow casting is restored. */
  shadowIn: number;
}

/**
 * Distance bands (player → NPC, metres). Only the 0–17 m band matters:
 * beyond impostorOut (~17 m) the full model is hidden by visual LOD and the
 * mixer is skipped entirely. Gaps between in/out thresholds mirror
 * resolveNpcLod hysteresis spacing and prevent tier flapping when the
 * player hovers at a boundary.
 */
export const DEFAULT_NPC_ANIMATION_LOD: NpcAnimationLodThresholds = {
  reducedOut: 9,
  reducedIn: 7,
  minimalOut: 15,
  minimalIn: 12,
  shadowOut: 10,
  shadowIn: 8,
};

/** Mixer refresh rates for throttled tiers ('full' runs every frame). */
export const NPC_MIXER_HZ: Record<Exclude<NpcAnimationLodLevel, 'full'>, number> = {
  reduced: 30,
  minimal: 15,
};

/** Upper bound for one accumulated mixer step (frame-stall safety). */
export const NPC_MIXER_MAX_STEP_S = 0.12;

/** Scale thresholds — lower lodBias throttles sooner, higher keeps full rate longer. */
export function scaleNpcAnimationLodThresholds(
  base: NpcAnimationLodThresholds,
  lodBias: number,
): NpcAnimationLodThresholds {
  // Same clamp family as scaleNpcLodThresholds floor, plus an ultra cap so a
  // very high bias cannot push throttling past the visual impostor band.
  const scale = Math.min(Math.max(lodBias, 0.25), 1.25);
  return {
    reducedOut: base.reducedOut * scale,
    reducedIn: base.reducedIn * scale,
    minimalOut: base.minimalOut * scale,
    minimalIn: base.minimalIn * scale,
    shadowOut: base.shadowOut * scale,
    shadowIn: base.shadowIn * scale,
  };
}

/**
 * Resolve the animation tier with hysteresis to avoid flapping at boundaries.
 * `forceFull` keeps interaction-close NPCs and dialogue partners at full rate
 * regardless of distance (mirrors resolveNpcLod forceFull).
 */
export function resolveNpcAnimationLod(
  distance: number,
  current: NpcAnimationLodLevel,
  thresholds: NpcAnimationLodThresholds = DEFAULT_NPC_ANIMATION_LOD,
  forceFull = false,
): NpcAnimationLodLevel {
  if (forceFull) return 'full';

  switch (current) {
    case 'full':
      if (distance >= thresholds.minimalOut) return 'minimal';
      if (distance >= thresholds.reducedOut) return 'reduced';
      return 'full';
    case 'reduced':
      if (distance >= thresholds.minimalOut) return 'minimal';
      if (distance < thresholds.reducedIn) return 'full';
      return 'reduced';
    case 'minimal':
      if (distance < thresholds.reducedIn) return 'full';
      if (distance < thresholds.minimalIn) return 'reduced';
      return 'minimal';
    default: {
      const _exhaustive: never = current;
      return _exhaustive;
    }
  }
}

/**
 * Distance-gated shadow casting for full-LOD NPCs. Real dynamic shadows are
 * barely readable beyond ~10 m while every caster costs a shadow-map draw;
 * the grounding blob (NPCContactShadow) stays visible at all distances.
 */
export function resolveNpcShadowCasting(
  distance: number,
  current: boolean,
  thresholds: NpcAnimationLodThresholds = DEFAULT_NPC_ANIMATION_LOD,
): boolean {
  if (current) return distance < thresholds.shadowOut;
  return distance < thresholds.shadowIn;
}

export interface NpcMixerStep {
  /** Accumulator to keep for the next frame. */
  acc: number;
  /** Delta to pass to mixer.update — null means "skip pose refresh this frame". */
  updateDelta: number | null;
}

/**
 * Accumulate real frame deltas and flush a mixer.update once per throttle
 * interval. 'full' passes every frame through untouched (delta already
 * clamped by the caller). Accumulated steps are capped at
 * NPC_MIXER_MAX_STEP_S so a long frame stall cannot teleport animations.
 */
export function accumulateNpcMixerDelta(
  acc: number,
  dt: number,
  lod: NpcAnimationLodLevel,
): NpcMixerStep {
  if (lod === 'full') return { acc: 0, updateDelta: dt };
  const interval = 1 / NPC_MIXER_HZ[lod];
  const next = acc + dt;
  if (next >= interval) return { acc: 0, updateDelta: Math.min(next, NPC_MIXER_MAX_STEP_S) };
  return { acc: next, updateDelta: null };
}
