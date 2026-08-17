/* ─── Cinematic timeline + interaction triggers (extracted from PhysicsSceneInner) ───
 *
 * Must mount after NPC/ambient mounts and before interaction query bridges.
 * See physicsSceneMountOrder.ts for full invariant list.
 */

import { CinematicTimelineRunner } from './CinematicTimelineRunner';
import { InteractiveTriggers } from './InteractiveTriggers';
import { AaaCombatCinematic } from './AaaCombatCinematic';
import type * as THREE from 'three';

export interface PhysicsSceneCinematicMountsProps {
  livePlayerPositionRef: React.MutableRefObject<THREE.Vector3>;
  livePlayerRotationRef: React.MutableRefObject<number>;
}

export function PhysicsSceneCinematicMounts({
  livePlayerPositionRef,
  livePlayerRotationRef,
}: PhysicsSceneCinematicMountsProps) {
  return (
    <>
      <CinematicTimelineRunner />
      <InteractiveTriggers
        livePlayerPositionRef={livePlayerPositionRef}
        livePlayerRotationRef={livePlayerRotationRef}
      />
      <AaaCombatCinematic />
    </>
  );
}
