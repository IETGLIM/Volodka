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
import { MathUtils, Mesh, MeshBasicMaterial } from 'three';

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

  const meshRef = useRef<Mesh>(null);

  // Base values
  const baseOpacity = !preset.shadows
    ? firstPerson ? 0.56 : 0.58
    : firstPerson ? 0.34 : 0.42;
  const baseRadiusX = firstPerson ? 0.26 : 0.42;
  const baseRadiusZ = firstPerson ? 0.34 : 0.42;

  // Session 14 (closure-fix): reactive state in refs so useEffect event handlers
  // and useFrameTick share the same mutable values across renders. Previously `let`
  // in component body — reset to 0 every render, so the frame tick always read 0
  // (reactive contact shadow was dead code). Now alive at the sane Session 13 values.
  const sprintIntensityRef = useRef(0);
  const stepPulseRef = useRef(0);
  const landingSquashRef = useRef(0);

  useEffect(() => {
    const unsubs: Array<() => void> = [];

    // Sprint weight — shadow grows and darkens
    unsubs.push(eventBus.on('exploration:footstep', ({ runWeight, isSprinting }: any) => {
      const rw = Math.max(0, Math.min(1, runWeight ?? (isSprinting ? 1 : 0)));
      sprintIntensityRef.current = Math.max(sprintIntensityRef.current, rw * 1.0);
    }));

    // Every heavy step — quick pulse
    unsubs.push(eventBus.on('exploration:footstep', ({ runWeight }: any) => {
      const rw = Math.max(0, runWeight ?? 0);
      stepPulseRef.current = Math.max(stepPulseRef.current, 0.65 + rw * 0.9);
    }));

    // Hard landing — big squash + pulse
    unsubs.push(eventBus.on('player:landed' as any, ({ impact }: any) => {
      const str = Math.min(1, Math.max(0.35, impact || 0.6));
      landingSquashRef.current = Math.max(landingSquashRef.current, str * 1.15);
      stepPulseRef.current = Math.max(stepPulseRef.current, 0.9 + str * 0.7);
    }));

    // Hard brake — extra dramatic expansion
    unsubs.push(eventBus.on('player:hard_brake' as any, () => {
      sprintIntensityRef.current = Math.max(sprintIntensityRef.current, 1.3);
      stepPulseRef.current = Math.max(stepPulseRef.current, 1.4);
    }));

    // Sprint launch — instant big expansion (the moment you hit sprint)
    unsubs.push(eventBus.on('player:sprint_start' as any, () => {
      sprintIntensityRef.current = Math.max(sprintIntensityRef.current, 1.65);
      stepPulseRef.current = Math.max(stepPulseRef.current, 1.25);
    }));

    return () => unsubs.forEach(u => u());
  }, []);

  useFrameTick('player', ({ delta }) => {
    const m = meshRef.current;
    if (!m) return;

    const dt = Math.min(delta, 0.05);

    // Decay reactive values
    sprintIntensityRef.current = Math.max(0, sprintIntensityRef.current - dt * 2.8);
    stepPulseRef.current = Math.max(0, stepPulseRef.current - dt * 11);
    landingSquashRef.current = Math.max(0, landingSquashRef.current - dt * 7.5);

    // Session 13 (ramp-tame): totalWeight capped at 2.0 with sane multipliers.
    const sprintIntensity = sprintIntensityRef.current;
    const stepPulse = stepPulseRef.current;
    const landingSquash = landingSquashRef.current;
    // Session 21 (ramp-cleanup): totalWeight capped at 2.0 with sane multipliers.
    const totalWeight = Math.min(2.0, sprintIntensity * 0.8 + stepPulse * 0.75 + landingSquash * 0.9);

    // Scale the shadow (bigger = more weight pressing down)
    const scaleX = baseRadiusX * (1 + totalWeight * 0.15);
    const scaleZ = baseRadiusZ * (1 + totalWeight * 0.18);
    m.scale.set(scaleX / 0.42, 1, scaleZ / 0.42);

    // Opacity boost on heavy movement (darker, more "grounded" look)
    const mat = m.material as MeshBasicMaterial;
    if (mat) {
      const targetOpacity = baseOpacity + totalWeight * 0.3;
      mat.opacity = MathUtils.lerp(mat.opacity, Math.min(1.0, targetOpacity), 0.99);
    }

    // Slight vertical squash on hard landing (shadow flattens)
    const yOffset = landingSquash > 0.1 ? -0.3 * landingSquash : -0.385;
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
