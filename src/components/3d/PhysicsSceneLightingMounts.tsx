/* ─── Exploration lighting + scene environment (extracted from PhysicsSceneInner) ───
 *
 * Must remain last inside the Physics subtree — post-processing and fog attach
 * after all gameplay bridges. See physicsSceneMountOrder.ts for invariants.
 */

import { ExplorationLighting } from './Lighting';
import { SceneEnvironment } from './SceneEnvironment';

export function PhysicsSceneLightingMounts() {
  return (
    <>
      <ExplorationLighting />
      <SceneEnvironment />
    </>
  );
}
