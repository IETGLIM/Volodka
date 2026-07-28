/* ─── Volodka RPG – Player contact shadow mesh ───
 * Soft foot blob under the capsule. Quality-gated: always available as the
 * low-tier stand-in when shadow maps are off; fades when map shadows are on.
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
    CONTACT_SHADOW_CACHE_KEYS.player,
    () => createContactShadowTexture({ variant: 'player' }),
  );

  // Low / no shadow maps → stronger blob. Map shadows on → subtler dual-ink.
  const opacity = !preset.shadows
    ? firstPerson
      ? 0.48
      : 0.58
    : firstPerson
      ? 0.28
      : 0.42;
  const radius = firstPerson ? 0.32 : 0.42;

  return (
    <mesh rotation-x={-Math.PI / 2} position={[0, 0.004, 0]} renderOrder={-1}>
      <circleGeometry args={[radius, 32]} />
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
