/* ─── World dressing mounts (extracted from PhysicsSceneInner) ───
 *
 * Must mount after camera/hands and before NPC/ambient overlays.
 * See physicsSceneMountOrder.ts for full invariant list.
 */

import { TriggerZoneProps } from './TriggerZoneProp';
import { WorldItemPickupGlows } from './WorldItemPickupGlow';
import { ScenePropDressing } from './ScenePropDressing';
import { SceneManifestAssets } from './SceneManifestAssets';
import { SceneInteriorAssets } from './SceneInteriorAssets';
import { AaaCinematicAtmosphere } from './AaaCinematicAtmosphere';

export function PhysicsSceneWorldDressingMounts() {
  return (
    <>
      <TriggerZoneProps />
      <WorldItemPickupGlows />
      <ScenePropDressing />
      <SceneManifestAssets />
      <SceneInteriorAssets />
      <AaaCinematicAtmosphere />
    </>
  );
}
