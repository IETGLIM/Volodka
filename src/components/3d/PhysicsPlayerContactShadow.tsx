/* ─── Volodka RPG – Player contact shadow mesh ───
 * Soft foot blob under the capsule. Quality-gated: always available as the
 * low-tier stand-in when shadow maps are off; fades when map shadows are on.
 * First-person: tighter elliptical mark so the missing body still grounds.
 *
 * AAA Phase B "ебашь": fully reactive cinematic contact shadow.
 * - Grows bigger + darker on sprint (feels like weight pressing the ground)
 * - Compresses + pulses on every footstep and hard landing
 * - Gives incredible tactile "you are here and heavy" feedback without any text
 */

import { useRef, useEffect } from 'react';
import { useCachedCanvasTexture } from '@/hooks/useCachedCanvasTexture';
import {
  CONTACT_SHADOW_CACHE_KEYS,
  createContactShadowTexture,
} from '@/engine/three/contactShadowTexture';
import { useGraphicsQuality } from '@/engine/graphics/useGraphicsQuality';
import { useFrameTick } from '@/engine/frame/useFrameTick';
import { eventBus } from '@/engine/EventBus';
import * as THREE from 'three';

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

  const meshRef = useRef<THREE.Mesh>(null);

  // Base values
  const baseOpacity = !preset.shadows
    ? firstPerson ? 0.56 : 0.58
    : firstPerson ? 0.34 : 0.42;
  const baseRadiusX = firstPerson ? 0.26 : 0.42;
  const baseRadiusZ = firstPerson ? 0.34 : 0.42;

  // Reactive state (module-level is fine — single player)
  let sprintIntensity = 0;
  let stepPulse = 0;
  let landingSquash = 0;

  useEffect(() => {
    const unsubs: Array<() => void> = [];

    // Sprint weight — shadow grows and darkens
    unsubs.push(eventBus.on('exploration:footstep', ({ runWeight, isSprinting }: any) => {
      const rw = Math.max(0, Math.min(1, runWeight ?? (isSprinting ? 1 : 0)));
      sprintIntensity = Math.max(sprintIntensity, rw * 1.0);
    }));

    // Every heavy step — quick pulse
    unsubs.push(eventBus.on('exploration:footstep', ({ runWeight }: any) => {
      const rw = Math.max(0, runWeight ?? 0);
      stepPulse = Math.max(stepPulse, 0.65 + rw * 0.9);
    }));

    // Hard landing — big squash + pulse
    unsubs.push(eventBus.on('player:landed', ({ impact }: any) => {
      const str = Math.min(1, Math.max(0.35, impact || 0.6));
      landingSquash = Math.max(landingSquash, str * 1.15);
      stepPulse = Math.max(stepPulse, 0.9 + str * 0.7);
    }));

    // Hard brake — extra dramatic expansion
    unsubs.push(eventBus.on('player:hard_brake', () => {
      sprintIntensity = Math.max(sprintIntensity, 1.3);
      stepPulse = Math.max(stepPulse, 1.4);
    }));

    // Sprint launch — instant big expansion (the moment you hit sprint)
    unsubs.push(eventBus.on('player:sprint_start', () => {
      sprintIntensity = Math.max(sprintIntensity, 1.65);
      stepPulse = Math.max(stepPulse, 1.25);
    }));

    return () => unsubs.forEach(u => u());
  }, []);

  useFrameTick('player', ({ delta }) => {
    const m = meshRef.current;
    if (!m) return;

    const dt = Math.min(delta, 0.05);

    // Decay reactive values
    sprintIntensity = Math.max(0, sprintIntensity - dt * 2.8);
    stepPulse = Math.max(0, stepPulse - dt * 11);
    landingSquash = Math.max(0, landingSquash - dt * 7.5);

    const totalWeight = Math.min(9.8, sprintIntensity * 5.35 + stepPulse * 5.15 + landingSquash * 5.85); // PLANETARY GOD-CRUSH x2 — 9.8+ totalWeight, every sprint footstep is full apocalyptic earth collapse. HARDER for хм, и:

    // Scale the shadow (bigger = more weight pressing down) — 6.5–7.8+ now full nuclear 8+
    const scaleX = baseRadiusX * (1 + totalWeight * 1.38);
    const scaleZ = baseRadiusZ * (1 + totalWeight * 1.68);
    m.scale.set(scaleX / 0.42, 1, scaleZ / 0.42);

    // Opacity boost on heavy movement (darker, more "grounded" look)
    const mat = m.material as THREE.MeshBasicMaterial;
    if (mat) {
      const targetOpacity = baseOpacity + totalWeight * 0.72;
      mat.opacity = THREE.MathUtils.lerp(mat.opacity, Math.min(0.99, targetOpacity), 0.55);
    }

    // Slight vertical squash on hard landing (shadow flattens) — more dramatic yOffset
    const yOffset = landingSquash > 0.1 ? -0.048 * landingSquash : 0.001;
    m.position.y = yOffset;
  }, { label: 'ContactShadowReactive', phase: 'pre_render' });

  return (
    <mesh
      ref={meshRef}
      rotation-x={-Math.PI / 2}
      position={[0, 0.004, 0]}
      scale={[baseRadiusX / 0.42, 1, baseRadiusZ / 0.42]}
      renderOrder={-1}
    >
      <circleGeometry args={[0.42, 48]} />
      <meshBasicMaterial
        map={shadowTexture}
        transparent
        opacity={baseOpacity}
        depthWrite={false}
        polygonOffset
        polygonOffsetFactor={-1}
      />
    </mesh>
  );
}
