/* ─── Scene transition handler (extracted from PhysicsSceneInner) ───
 *
 * Must mount after proximity/quest overlays and before lifecycle bridges.
 * See physicsSceneMountOrder.ts for full invariant list.
 */

import { SceneTransitionHandler } from './SceneTransitionHandler';

export function PhysicsSceneTransitionMounts() {
  return <SceneTransitionHandler />;
}
