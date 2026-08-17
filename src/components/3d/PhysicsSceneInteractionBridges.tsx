/* ─── Interaction query/highlight bridges (extracted from PhysicsSceneInner) ───
 *
 * Must mount after InteractiveTriggers and before proximity/quest overlays.
 * See physicsSceneMountOrder.ts for full invariant list.
 */

import { InteractionQueryBridge } from './InteractionQueryBridge';
import { InteractionHighlight } from './InteractionHighlight';

export function PhysicsSceneInteractionBridges() {
  return (
    <>
      <InteractionQueryBridge />
      <InteractionHighlight />
    </>
  );
}
