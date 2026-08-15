/* ─── Environmental Hazard Ticker ───
 * Mounts inside R3F scene and ticks the environmental-hazards system every
 * frame. When the player stands in a hazard zone, it dispatches stress/energy
 * damage via the game store and pushes a notification for feedback.
 *
 * Hazards are defined declaratively in environmentalHazards.ts — adding a
 * new hazard requires only a new entry in the HAZARDS array.
 */
import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { useGameStore } from '@/store/gameStore';
import { useCurrentSceneId } from '@/store/selectors';
import { tickEnvironmentalHazards } from '@/engine/world/environmentalHazards';
import type * as THREE from 'three';

interface Props {
  livePlayerPositionRef: React.MutableRefObject<THREE.Vector3>;
}

export function EnvironmentalHazardTicker({ livePlayerPositionRef }: Props) {
  const sceneId = useCurrentSceneId();
  const lastToastTimeRef = useRef(0);

  useFrame((_, delta) => {
    const playerPos = livePlayerPositionRef.current;
    if (!playerPos || !sceneId) return;

    const result = tickEnvironmentalHazards(delta, sceneId, playerPos);
    if (!result) return;

    const store = useGameStore.getState();

    // Warning (amount === 0) — show once on zone enter.
    // Damage tick (amount > 0) — apply stress/energy damage + toast.
    if (result.amount > 0) {
      if (result.damageType === 'stress') {
        store.addStress(result.amount);
      } else {
        store.addEnergy(-result.amount);
      }
      // Throttle notifications to 1 per 3s to avoid spam
      const now = performance.now();
      if (now - lastToastTimeRef.current > 3000) {
        lastToastTimeRef.current = now;
        store.pushNotification(result.damageType, result.warningText);
      }
    } else {
      // Entry warning — always emit
      store.pushNotification(result.damageType, result.warningText);
    }
  });

  return null;
}
