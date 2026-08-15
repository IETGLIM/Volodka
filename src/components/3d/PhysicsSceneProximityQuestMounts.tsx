/* ─── Proximity + quest overlays (extracted from PhysicsSceneInner) ───
 *
 * Must mount after interaction query bridges and before scene transitions.
 * See physicsSceneMountOrder.ts for full invariant list.
 *
 * Note: EnvironmentalHazardSystem is mounted separately in PhysicsSceneInner
 * (it needs the same livePlayerPositionRef but is part of the core physics
 * scene lifecycle, not the proximity/quest overlay layer).
 */

import { ProximityReactivityRenderer } from './ProximityReactivityRenderer';
import { SceneExitIndicator } from './SceneExitIndicator';
import { QuestWaypoints } from './QuestWaypoints';
import { ChoiceReactivity } from './ChoiceReactivity';
import type * as THREE from 'three';

export interface PhysicsSceneProximityQuestMountsProps {
  livePlayerPositionRef: React.MutableRefObject<THREE.Vector3>;
}

export function PhysicsSceneProximityQuestMounts({
  livePlayerPositionRef,
}: PhysicsSceneProximityQuestMountsProps) {
  return (
    <>
      <ProximityReactivityRenderer livePlayerPositionRef={livePlayerPositionRef} />
      <SceneExitIndicator livePlayerPositionRef={livePlayerPositionRef} />
      <QuestWaypoints livePlayerPositionRef={livePlayerPositionRef} />
      <ChoiceReactivity />
    </>
  );
}
