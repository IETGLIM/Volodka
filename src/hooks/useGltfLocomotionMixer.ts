import { useEffect, useRef, type MutableRefObject } from 'react';
import * as THREE from 'three';
import { useFrameTick } from '@/engine/frame/useFrameTick';
import { findLocomotionClip } from '@/engine/assets/gltfLocomotionClips';

const CROSSFADE = 0.25;

/**
 * Drive a skinned GLTF mixer from PhysicsPlayer locomotion states (idle/walk/run/jump).
 */
export function useGltfLocomotionMixer(
  mixer: THREE.AnimationMixer | null,
  animations: THREE.AnimationClip[] | undefined,
  currentAnimRef: MutableRefObject<string>,
): void {
  const currentStateRef = useRef<string>('idle');
  const currentActionRef = useRef<THREE.AnimationAction | null>(null);

  useEffect(() => {
    if (!mixer || !animations?.length) return;

    const idleClip = findLocomotionClip(animations, 'idle');
    if (!idleClip) return;

    const action = mixer.clipAction(idleClip);
    action.reset().fadeIn(CROSSFADE).play();
    currentActionRef.current = action;
    currentStateRef.current = 'idle';

    return () => {
      action.stop();
      currentActionRef.current = null;
    };
  }, [mixer, animations]);

  useFrameTick('player', ({ delta }) => {
    if (!mixer || !animations?.length) return;

    mixer.update(Math.min(delta, 0.05));

    const nextState = currentAnimRef.current;
    if (nextState === currentStateRef.current) return;

    const clip = findLocomotionClip(animations, nextState);
    if (!clip) return;

    const prev = currentActionRef.current;
    const next = mixer.clipAction(clip);
    next.reset().setEffectiveWeight(1).fadeIn(CROSSFADE).play();
    prev?.fadeOut(CROSSFADE);

    currentActionRef.current = next;
    currentStateRef.current = nextState;
  });
}
