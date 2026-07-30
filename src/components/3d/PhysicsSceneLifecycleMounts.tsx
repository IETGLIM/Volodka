/* ─── GPU + Rapier lifecycle bridges (extracted from PhysicsSceneInner) ───
 *
 * Must mount after scene transition handler and before InteractionSystemBridge.
 * See physicsSceneMountOrder.ts for full invariant list.
 */

import { SceneGpuLifecycleBridge } from './SceneGpuLifecycleBridge';
import { RapierWorldLifecycleBridge } from './RapierWorldLifecycleBridge';

export function PhysicsSceneLifecycleMounts() {
  return (
    <>
      <SceneGpuLifecycleBridge />
      <RapierWorldLifecycleBridge />
    </>
  );
}
