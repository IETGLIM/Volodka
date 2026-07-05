import type * as THREE from 'three';

/** Quaternius / Mixamo humanoid clip names on the hero GLB (priority order). */
export const PLAYER_IDLE_CLIP_NAMES = [
  'Idle_Neutral',
  'Idle',
  'idle',
  'IDLE',
] as const;

export const PLAYER_WALK_CLIP_NAMES = [
  'Walk',
  'walking',
  'Walking',
  'walk',
] as const;

export const PLAYER_RUN_CLIP_NAMES = [
  'Run',
  'running',
  'Running',
  'run',
] as const;

export function pickPlayerClipAction(
  actions: Record<string, THREE.AnimationAction> | null | undefined,
  names: readonly string[],
): THREE.AnimationAction | null {
  if (!actions) return null;
  for (const name of names) {
    const action = actions[name];
    if (action) return action;
  }
  return null;
}

export function findPlayerAnimationClip(
  animations: THREE.AnimationClip[],
  pattern: RegExp,
  exclude?: THREE.AnimationClip,
): THREE.AnimationClip | undefined {
  return animations.find(
    (clip) => clip !== exclude && pattern.test(clip.name),
  );
}

/**
 * Combat/death clips must never be used as idle fallback (Quaternius GLB order).
 * [roadmap:ANIM-03] Added 'tpose|t_pose' — T-pose clip must never leak as idle.
 */
const UNSAFE_IDLE_CLIP_PATTERN =
  /death|die|hit|fall|jump|combat|attack|damage|hurt|knock|tpose|t_pose/i;

export function isUnsafeIdleClipName(name: string): boolean {
  return UNSAFE_IDLE_CLIP_PATTERN.test(name);
}

/** Last-resort idle when aliases miss — skips Death/Hit/etc. */
export function pickSafeIdleClipAction(
  actions: Record<string, THREE.AnimationAction> | null | undefined,
): THREE.AnimationAction | null {
  const fromAliases = pickPlayerClipAction(actions, PLAYER_IDLE_CLIP_NAMES);
  if (fromAliases) return fromAliases;
  if (!actions) return null;

  for (const [key, action] of Object.entries(actions)) {
    if (action && /idle/i.test(key) && !isUnsafeIdleClipName(key)) return action;
  }
  for (const [key, action] of Object.entries(actions)) {
    if (action && !isUnsafeIdleClipName(key)) return action;
  }
  return null;
}
