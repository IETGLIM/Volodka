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

const CLIP_CROSSFADE_SEC = 0.2;

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

    const bindKey = `${animations.length}:${Object.keys(actions).sort().join(',')}`;
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

    prevLocomotionRef.current = false;
    prevRunWeightRef.current = 0;
    mixer.update(0);
    root.updateMatrixWorld(true);

    return () => {
      for (const action of [idleActionRef.current, walkActionRef.current, runActionRef.current]) {
        action?.stop();
      }
      idleActionRef.current = null;
      walkActionRef.current = null;
      runActionRef.current = null;
      boundKeyRef.current = null;
    };
  }, [mixer, root, animations, actions]);

  useFrameTick(
    'player',
    ({ delta }) => {
      if (!mixer) return;

      const clipState = resolveLocomotionClipState(currentAnimRef.current);
      const idleAction = idleActionRef.current;
      const walkAction = walkActionRef.current;
      const runAction = runActionRef.current;

      if (!idleAction && !walkAction) return;

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
