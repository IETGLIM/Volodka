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
