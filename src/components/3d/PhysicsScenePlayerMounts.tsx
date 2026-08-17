/* ─── Colliders + player mounts (extracted from PhysicsSceneInner) ───
 *
 * Must mount first inside `<Physics>` — before camera/hands and all overlays.
 * See physicsSceneMountOrder.ts for full invariant list.
 */

import type * as THREE from 'three';
import { SceneColliderSelector } from './SceneColliderSelector';
import { EnvironmentalAnimator } from './EnvironmentalAnimator';
import { PhysicsPlayer } from './PhysicsPlayer';
import type { VirtualControls } from '@/hooks/useGamePhysics';
import { eventBus } from '@/engine/EventBus';

export interface PhysicsScenePlayerMountsProps {
  livePlayerPositionRef: React.MutableRefObject<THREE.Vector3>;
  livePlayerRotationRef: React.MutableRefObject<number>;
  virtualControlsRef: React.MutableRefObject<VirtualControls>;
  moveBlendRef: React.MutableRefObject<number>;
  physicsPaused: boolean;
}

export function PhysicsScenePlayerMounts({
  livePlayerPositionRef,
  livePlayerRotationRef,
  virtualControlsRef,
  moveBlendRef,
  physicsPaused,
}: PhysicsScenePlayerMountsProps) {
  return (
    <>
      <SceneColliderSelector livePlayerPositionRef={livePlayerPositionRef} />
      <EnvironmentalAnimator livePlayerPositionRef={livePlayerPositionRef} />
      <PhysicsPlayer
        livePlayerPositionRef={livePlayerPositionRef}
        livePlayerRotationRef={livePlayerRotationRef}
        virtualControlsRef={virtualControlsRef}
        moveBlendRef={moveBlendRef}
        physicsPaused={physicsPaused}
        onInteractPress={() => {
          eventBus.emit('interact:press', { source: 'player' });
        }}
      />
    </>
  );
}
