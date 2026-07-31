/* ─── Volodka RPG – Player contact shadow mesh ───
 * Soft foot blob under the capsule. Quality-gated: always available as the
 * low-tier stand-in when shadow maps are off; fades when map shadows are on.
 * First-person: tighter elliptical mark so the missing body still grounds.
 */

import { useCachedCanvasTexture } from '@/hooks/useCachedCanvasTexture';
import {
  CONTACT_SHADOW_CACHE_KEYS,
  createContactShadowTexture,
} from '@/engine/three/contactShadowTexture';
import { useGraphicsQuality } from '@/engine/graphics/useGraphicsQuality';

export interface PhysicsPlayerContactShadowProps {
  /** First-person / body-hidden: keep a tighter ground mark under the capsule. */
  firstPerson?: boolean;
}

/** Contact shadow — flat circle mesh under player feet with radial gradient. */
export function PhysicsPlayerContactShadow({
  firstPerson = false,
}: PhysicsPlayerContactShadowProps) {
  const { preset } = useGraphicsQuality();
  const shadowTexture = useCachedCanvasTexture(
    firstPerson ? CONTACT_SHADOW_CACHE_KEYS.playerFp : CONTACT_SHADOW_CACHE_KEYS.player,
    () =>
      createContactShadowTexture({
        variant: firstPerson ? 'playerFp' : 'player',
      }),
  );

  // Low / no shadow maps → stronger blob. Map shadows on → subtler dual-ink.
  // FP keeps a denser core so the capsule still reads as planted without a body mesh.
  const opacity = !preset.shadows
    ? firstPerson
      ? 0.56
      : 0.58
    : firstPerson
      ? 0.34
      : 0.42;
  const radiusX = firstPerson ? 0.26 : 0.42;
  const radiusZ = firstPerson ? 0.34 : 0.42;

  return (
    <mesh
      rotation-x={-Math.PI / 2}
      position={[0, 0.004, 0]}
      scale={[radiusX / 0.42, 1, radiusZ / 0.42]}
      renderOrder={-1}
    >
      <circleGeometry args={[0.42, 48]} />
      <meshBasicMaterial
        map={shadowTexture}
        transparent
        opacity={opacity}
        depthWrite={false}
        polygonOffset
        polygonOffsetFactor={-1}
      />
    </mesh>
  );
}
