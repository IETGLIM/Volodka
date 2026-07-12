import * as THREE from 'three';
import {
  findPlayerAnimationClip,
  pickPlayerClipAction,
  pickSafeIdleClipAction,
  PLAYER_IDLE_CLIP_NAMES,
  PLAYER_RUN_CLIP_NAMES,
  PLAYER_WALK_CLIP_NAMES,
} from '@/engine/player/playerClipResolution';

export function bindPlayerClipActions(
  mixer: THREE.AnimationMixer,
  actions: Record<string, THREE.AnimationAction> | null,
  animations: THREE.AnimationClip[],
  root: THREE.Object3D,
): {
  idle: THREE.AnimationAction | null;
  walk: THREE.AnimationAction | null;
  run: THREE.AnimationAction | null;
} {
  const pickAction = (names: readonly string[]): THREE.AnimationAction | null =>
    pickPlayerClipAction(actions, names);

  const idleAction =
    pickAction(PLAYER_IDLE_CLIP_NAMES) ?? pickSafeIdleClipAction(actions);

  const walkClip = findPlayerAnimationClip(
    animations,
    /walk/i,
    idleAction?.getClip(),
  );
  const walkAction =
    pickAction(PLAYER_WALK_CLIP_NAMES) ??
    (walkClip ? mixer.clipAction(walkClip, root) : idleAction);

  const runClip = findPlayerAnimationClip(
    animations,
    /run/i,
    walkAction?.getClip() ?? idleAction?.getClip(),
  );
  const runAction = runClip
    ? pickAction(PLAYER_RUN_CLIP_NAMES) ?? mixer.clipAction(runClip, root)
    : null;

  return { idle: idleAction, walk: walkAction, run: runAction };
}
