/* ─── Interaction system + rotation sync (extracted from PhysicsSceneInner) ───
 *
 * Must mount after lifecycle bridges and before lighting/environment.
 * See physicsSceneMountOrder.ts for full invariant list.
 */

import type * as THREE from 'three';
import { InteractionSystemBridge } from './InteractionSystemBridge';
import { RotationSyncBridge } from './RotationSyncBridge';

export interface PhysicsSceneInteractionSystemMountsProps {
  livePlayerPositionRef: React.MutableRefObject<THREE.Vector3>;
  livePlayerRotationRef: React.MutableRefObject<number>;
}

export function PhysicsSceneInteractionSystemMounts({
  livePlayerPositionRef,
  livePlayerRotationRef,
}: PhysicsSceneInteractionSystemMountsProps) {
  return (
    <>
      <InteractionSystemBridge
        livePlayerPositionRef={livePlayerPositionRef}
        livePlayerRotationRef={livePlayerRotationRef}
      />
      <RotationSyncBridge
        livePlayerRotationRef={livePlayerRotationRef}
        livePlayerPositionRef={livePlayerPositionRef}
      />
    </>
  );
}
