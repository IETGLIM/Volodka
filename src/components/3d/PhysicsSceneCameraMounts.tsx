/* ─── Camera + first-person hands (extracted from PhysicsSceneInner) ───
 *
 * Must mount after colliders/player and before world dressing overlays.
 * See physicsSceneMountOrder.ts for full invariant list.
 */

import type * as THREE from 'three';
import { FollowCamera } from './FollowCamera';
import { FirstPersonHands } from './FirstPersonHands';

export interface PhysicsSceneCameraMountsProps {
  livePlayerPositionRef: React.MutableRefObject<THREE.Vector3>;
  livePlayerRotationRef: React.MutableRefObject<number>;
  moveBlendRef: React.MutableRefObject<number>;
}

export function PhysicsSceneCameraMounts({
  livePlayerPositionRef,
  livePlayerRotationRef,
  moveBlendRef,
}: PhysicsSceneCameraMountsProps) {
  return (
    <>
      <FollowCamera
        livePlayerPositionRef={livePlayerPositionRef}
        livePlayerRotationRef={livePlayerRotationRef}
        moveBlendRef={moveBlendRef}
      />
      <FirstPersonHands moveBlendRef={moveBlendRef} />
    </>
  );
}
