/* ─── Volodka RPG – Player contact shadow mesh ───
 *  Session 9: Improved shadow texture (128px, tighter gradient),
 *  slightly larger radius for better distance judgment.
 */

import { useCachedCanvasTexture } from '@/hooks/useCachedCanvasTexture';
import {
  CONTACT_SHADOW_CACHE_KEYS,
  createContactShadowTexture,
} from '@/engine/three/contactShadowTexture';

/** Contact shadow — flat circle mesh under player feet with radial gradient */
export function PhysicsPlayerContactShadow() {
  const shadowTexture = useCachedCanvasTexture(
    CONTACT_SHADOW_CACHE_KEYS.player,
    () => createContactShadowTexture({ variant: 'player' }),
  );

  return (
    <mesh rotation-x={-Math.PI / 2} position={[0, 0.005, 0]}>
      <circleGeometry args={[0.45, 32]} />
      <meshBasicMaterial
        map={shadowTexture}
        transparent
        opacity={0.75}
        depthWrite={false}
      />
    </mesh>
  );
}