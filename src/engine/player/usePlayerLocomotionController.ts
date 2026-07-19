import { useLayoutEffect, useRef } from 'react';
import type { MutableRefObject } from 'react';
import * as THREE from 'three';
import { useFrameTick } from '@/engine/frame/useFrameTick';
import {
  resolveLocomotionClipState,
  resolveRunWalkCrossfadeTarget,
} from '@/engine/player/playerLocomotionPresentation';
import {
  bindPlayerClipActions,
} from '@/engine/player/playerLocomotionClips';
import {
  PLAYER_IDLE_CLIP_NAMES,
  PLAYER_WALK_CLIP_NAMES,
  PLAYER_RUN_CLIP_NAMES,
} from '@/engine/player/playerClipResolution';

const CLIP_CROSSFADE_SEC = 0.2;

const LOCOMOTION_CLIP_NAMES = new Set<string>([
  ...PLAYER_IDLE_CLIP_NAMES,
  ...PLAYER_WALK_CLIP_NAMES,
  ...PLAYER_RUN_CLIP_NAMES,
]);

/**
 * Build a bind-key that ONLY changes when the locomotion-relevant actions
 * (idle/walk/run) change. Loading a non-locomotion Mixamo clip (e.g.
 * 'sitting', 'sleeping') does NOT change this key, so the locomotion
 * actions are not needlessly re-bound (which would reset the crossfade
 * and cause the walk animation to flicker/restart).
 */
function computeLocomotionBindKey(
  animations: THREE.AnimationClip[],
  actions: Record<string, THREE.AnimationAction>,
): string {
  const locomotionKeys = Object.keys(actions)
    .filter((k) => LOCOMOTION_CLIP_NAMES.has(k))
    .sort()
    .join(',');
  return `${animations.length}:${locomotionKeys}`;
}

export interface UsePlayerLocomotionControllerOptions {
  mixer: THREE.AnimationMixer | null;
  root: THREE.Object3D;
  animations: THREE.AnimationClip[];
  /** Merged embedded + optional Mixamo clip actions. */
  actions: Record<string, THREE.AnimationAction> | null;
  currentAnimRef: MutableRefObject<string>;
}

/**
 * AAA locomotion blend tree for the hero GLB — idle / walk / run with crossfade.
 * Binds once per mixer+actions identity; updates after physics sets currentAnimRef.
 */
export function usePlayerLocomotionController({
  mixer,
  root,
  animations,
  actions,
  currentAnimRef,
}: UsePlayerLocomotionControllerOptions): void {
  const idleActionRef = useRef<THREE.AnimationAction | null>(null);
  const walkActionRef = useRef<THREE.AnimationAction | null>(null);
  const runActionRef = useRef<THREE.AnimationAction | null>(null);
  const prevLocomotionRef = useRef(false);
  const prevRunWeightRef = useRef(0);
  const boundKeyRef = useRef<string | null>(null);

  useLayoutEffect(() => {
    if (!mixer || !actions || animations.length === 0) {
      idleActionRef.current = null;
      walkActionRef.current = null;
      runActionRef.current = null;
      boundKeyRef.current = null;
      return;
    }

    // Only re-bind when the LOCOMOTION-relevant actions change, not when
    // non-locomotion Mixamo clips (sitting, sleeping, etc.) load.
    const bindKey = computeLocomotionBindKey(animations, actions);
    if (boundKeyRef.current === bindKey) return;
    boundKeyRef.current = bindKey;

    for (const action of [idleActionRef.current, walkActionRef.current, runActionRef.current]) {
      action?.stop();
    }

    const { idle: idleAction, walk: walkAction, run: runAction } = bindPlayerClipActions(
      mixer,
      actions,
      animations,
      root,
    );

    if (idleAction) {
      idleAction.setLoop(THREE.LoopRepeat, Infinity);
      idleAction.reset();
      idleAction.setEffectiveWeight(1);
      idleAction.play();
      idleActionRef.current = idleAction;
    } else {
      idleActionRef.current = null;
    }

    if (walkAction && walkAction !== idleAction) {
      walkAction.setLoop(THREE.LoopRepeat, Infinity);
      walkAction.reset();
      walkAction.setEffectiveWeight(0);
      walkAction.play();
      walkActionRef.current = walkAction;
    } else {
      walkActionRef.current = walkAction && walkAction !== idleAction ? walkAction : null;
    }

    if (runAction && runAction !== walkAction && runAction !== idleAction) {
      runAction.setLoop(THREE.LoopRepeat, Infinity);
      runAction.reset();
      runAction.setEffectiveWeight(0);
      runAction.play();
      runActionRef.current = runAction;
    } else {
      runActionRef.current = null;
    }

    // Preserve the current locomotion state across re-binds. Previously
    // this was reset to false, which caused the walk crossfade to restart
    // every time a Mixamo clip loaded (6 clips = 6 restarts). Instead,
    // check the current anim and set prevLocomotionRef to match, so the
    // crossfade logic only fires when the anim ACTUALLY changes.
    const currentClipState = resolveLocomotionClipState(currentAnimRef.current);
    prevLocomotionRef.current = currentClipState.locomotionActive && !!walkAction;
    prevRunWeightRef.current = currentClipState.runWeight;
    // If the player is already walking, immediately start the crossfade
    // so there's no 1-frame gap where the walk action has weight 0.
    if (prevLocomotionRef.current && idleAction && walkAction) {
      idleAction.setEffectiveWeight(0);
      walkAction.setEffectiveWeight(1);
    }
    mixer.update(0);

    return () => {
      for (const action of [idleActionRef.current, walkActionRef.current, runActionRef.current]) {
        action?.stop();
      }
      idleActionRef.current = null;
      walkActionRef.current = null;
      runActionRef.current = null;
      boundKeyRef.current = null;
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps -- currentAnimRef is a stable ref
  }, [mixer, root, animations, actions]);

  useFrameTick(
    'player',
    ({ delta }) => {
      if (!mixer) return;

      const clipState = resolveLocomotionClipState(currentAnimRef.current);
      const idleAction = idleActionRef.current;
      const walkAction = walkActionRef.current;
      const runAction = runActionRef.current;

      // Always call mixer.update(delta) so the mixer advances even if
      // actions aren't bound yet (e.g., during the brief window between
      // useSkinnedGltfClone commit and useLayoutEffect bind). Without this,
      // the model would freeze in a static pose until the bind completes.
      if (!idleAction && !walkAction) {
        mixer.update(delta);
        return;
      }

      const locomotionActive = clipState.locomotionActive && !!walkAction;

      if (locomotionActive !== prevLocomotionRef.current) {
        if (locomotionActive && walkAction && idleAction) {
          idleAction.crossFadeTo(walkAction, CLIP_CROSSFADE_SEC, false);
        } else if (!locomotionActive && idleAction && walkAction) {
          walkAction.crossFadeTo(idleAction, CLIP_CROSSFADE_SEC, false);
          prevRunWeightRef.current = 0;
        }
        prevLocomotionRef.current = locomotionActive;
      }

      if (locomotionActive && walkAction) {
        walkAction.timeScale = clipState.walkTimeScale;
        if (runAction) {
          runAction.timeScale = clipState.runTimeScale;
          const crossfadeTarget = resolveRunWalkCrossfadeTarget(
            prevRunWeightRef.current,
            clipState.runWeight,
          );
          if (crossfadeTarget === 'walk_to_run') {
            walkAction.crossFadeTo(runAction, CLIP_CROSSFADE_SEC, false);
          } else if (crossfadeTarget === 'run_to_walk') {
            runAction.crossFadeTo(walkAction, CLIP_CROSSFADE_SEC, false);
          }
          prevRunWeightRef.current = clipState.runWeight;
        } else {
          walkAction.timeScale = clipState.runWeight > 0
            ? clipState.runTimeScale
            : clipState.walkTimeScale;
        }
      } else if (idleAction) {
        idleAction.timeScale = 1;
      }

      mixer.update(delta);
    },
    { phase: 'post_physics', label: 'PlayerLocomotionMixer' },
  );
}
