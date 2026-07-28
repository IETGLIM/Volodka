/* ─── Volodka RPG – Player contact shadow mesh ───
 *  Session 9: Improved shadow texture (128px, tighter gradient),
 *  slightly larger radius for better distance judgment.
 */

import { useCachedCanvasTexture } from '@/hooks/useCachedCanvasTexture';
import {
  CONTACT_SHADOW_CACHE_KEYS,
  createContactShadowTexture,
} from '@/engine/three/contactShadowTexture';

/** Contact shadow — flat circle mesh under player feet with radial gradient.
 *  Slightly softer than NPC so real shadow maps + blob don't double-ink feet.
 */
export function PhysicsPlayerContactShadow() {
  const shadowTexture = useCachedCanvasTexture(
    CONTACT_SHADOW_CACHE_KEYS.player,
    () => createContactShadowTexture({ variant: 'player' }),
  );

  return (
    <mesh rotation-x={-Math.PI / 2} position={[0, 0.004, 0]} renderOrder={-1}>
      <circleGeometry args={[0.42, 32]} />
      <meshBasicMaterial
        map={shadowTexture}
        transparent
        opacity={0.55}
        depthWrite={false}
        polygonOffset
        polygonOffsetFactor={-1}
      />
    </mesh>
  );
}