import { useEffect, useRef, type MutableRefObject } from 'react';
import * as THREE from 'three';
import { useFrameTick } from '@/engine/frame/useFrameTick';
import { findLocomotionClip } from '@/engine/assets/gltfLocomotionClips';

const CROSSFADE = 0.25;
const ONE_SHOT_STATES = new Set(['attack']);

/**
 * Drive a skinned GLTF mixer from PhysicsPlayer locomotion states (idle/walk/run/jump).
 * One-shot states (attack) play once then return to idle.
 */
export function useGltfLocomotionMixer(
  mixer: THREE.AnimationMixer | null,
  animations: THREE.AnimationClip[] | undefined,
  currentAnimRef: MutableRefObject<string>,
): void {
  const currentStateRef = useRef<string>('idle');
  const currentActionRef = useRef<THREE.AnimationAction | null>(null);
  const idleActionRef = useRef<THREE.AnimationAction | null>(null);

  useEffect(() => {
    if (!mixer || !animations?.length) return;

    const idleClip = findLocomotionClip(animations, 'idle');
    if (!idleClip) return;

    const action = mixer.clipAction(idleClip);
    action.reset().fadeIn(CROSSFADE).play();
    currentActionRef.current = action;
    idleActionRef.current = action;
    currentStateRef.current = 'idle';

    const onFinished = (event: THREE.Event & { action?: THREE.AnimationAction }) => {
      const finished = event.action;
      if (!finished || finished === idleActionRef.current) return;
      if (currentStateRef.current !== 'attack') return;
      currentAnimRef.current = 'idle';
      currentStateRef.current = 'idle';
      const idle = idleActionRef.current;
      if (idle) {
        idle.reset().fadeIn(CROSSFADE).play();
        currentActionRef.current = idle;
      }
    };

    mixer.addEventListener('finished', onFinished);

    return () => {
      mixer.removeEventListener('finished', onFinished);
      action.stop();
      currentActionRef.current = null;
      idleActionRef.current = null;
    };
  }, [mixer, animations, currentAnimRef]);

  useFrameTick('player', ({ delta }) => {
    if (!mixer || !animations?.length) return;

    mixer.update(Math.min(delta, 0.05));

    const nextState = currentAnimRef.current;
    if (nextState === currentStateRef.current) return;

    const clip = findLocomotionClip(animations, nextState);
    if (!clip) {
      if (ONE_SHOT_STATES.has(nextState)) return;
      return;
    }

    const prev = currentActionRef.current;
    const next = mixer.clipAction(clip);
    if (ONE_SHOT_STATES.has(nextState)) {
      next.setLoop(THREE.LoopOnce, 1);
      next.clampWhenFinished = true;
    } else {
      next.setLoop(THREE.LoopRepeat, Infinity);
      next.clampWhenFinished = false;
    }
    next.reset().setEffectiveWeight(1).fadeIn(CROSSFADE).play();
    prev?.fadeOut(CROSSFADE);

    currentActionRef.current = next;
    currentStateRef.current = nextState;
  });
}
