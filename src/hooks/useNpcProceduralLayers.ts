import { useEffect, useId, useRef } from 'react';
import type * as THREE from 'three';
import { useRegisterNpcFrame } from '@/engine/npc/npcFrameBatch';
import type { NPCAnimationState } from '@/engine/interaction/interactionMachine';
import { updateNpcProceduralLayers } from '@/engine/npc/npcProceduralLayers';

export interface UseNpcProceduralLayersOptions {
  npcId: string;
  modelRef: React.RefObject<THREE.Group | null>;
  animState: NPCAnimationState;
  playerPositionRef: React.RefObject<THREE.Vector3>;
  headTrackingEnabled?: boolean;
  headTrackingDistance?: number;
  enabled?: boolean;
}

/**
 * Procedural animation layers applied after Mixamo mixer or limb animation:
 * breathing, blink, sway, layered head/eye tracking, talk gestures.
 */
export function useNpcProceduralLayers({
  npcId,
  modelRef,
  animState,
  playerPositionRef,
  headTrackingEnabled = true,
  headTrackingDistance = 8,
  enabled = true,
}: UseNpcProceduralLayersOptions): void {
  const tickOwner = useId();
  const animStateRef = useRef(animState);
  animStateRef.current = animState;

  useEffect(() => {
    animStateRef.current = animState;
  }, [animState]);

  useRegisterNpcFrame(
    `${tickOwner}:${npcId}`,
    'overlay',
    ({ delta }) => {
      const root = modelRef.current;
      if (!root) return;
      updateNpcProceduralLayers({
        npcId,
        root,
        animState: animStateRef.current,
        playerPosition: playerPositionRef.current,
        delta,
        headTrackingEnabled,
        headTrackingDistance,
      });
    },
    { enabled },
  );
}
