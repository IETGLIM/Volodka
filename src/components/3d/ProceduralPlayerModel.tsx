
/* ─── Procedural human-like model — "Уставший Инженер" (Tired Engineer)
 *  AAA-quality procedural humanoid with:
 *  - Proper head with jawline, chin, eyes, pupils, nose, mouth, eyebrows, ears, messy hair
 *  - Dark hoodie (oversized, hood down), jeans, sneakers
 *  - Laptop bag strap across chest
 *  - Skin-tone hands, karma wristband glow
 *  - Slouched posture, tired engineer vibe
 *  - Natural procedural animations (tired walk/run, casual arm swing, shoulder shrug idle)
 *
 *  Optimizations applied:
 *  1. Cached getObjectByName lookups via bodyPartsRef (no per-frame string traversal)
 *  2. Shared geometry instances via useMemo (reduced GPU buffer allocation)
 *  3. Shared material instances via useMemo (reduced shader compilation)
 *  4. Proper disposal of shared geometries and materials on unmount
 *  5. Memoized karma-dependent materials keyed on karmaGlow (avoids per-render allocation)
 *  6. Hair geometries moved to sharedGeo (avoids repeated small sphere allocation)
 *  7. React.memo wrapper — prevents re-renders when parent re-renders without prop changes
 */

import { useRef, useEffect, useMemo, memo } from 'react';
import * as THREE from 'three';
import { useIsMobileVisual } from '@/hooks/use-mobile';
import { ProceduralPlayerModelLite } from './ProceduralPlayerModelLite';
import {
  useProceduralPlayerAnimation,
  type ProceduralPlayerModelProps,
} from './useProceduralPlayerAnimation';

export const ProceduralPlayerModel = memo(function ProceduralPlayerModel({
  modelScale,
  karmaGlow,
  currentAnimRef,
  rotationRef,
}: ProceduralPlayerModelProps) {
  const groupRef = useRef<THREE.Group>(null);

  useProceduralPlayerAnimation(groupRef, rotationRef, currentAnimRef);

  /* ─── Shared geometry instances (optimization 2) ─── */
  const sharedGeo = useMemo(() => ({
    upperArmCapsule: new THREE.CapsuleGeometry(0.048, 0.18, 4, 6),
    forearmCapsule: new THREE.CapsuleGeometry(0.042, 0.14, 4, 6),
    wristCapsule: new THREE.CapsuleGeometry(0.032, 0.03, 3, 5),
    handSphere: new THREE.SphereGeometry(0.028, 5, 4),
    upperLegCapsule: new THREE.CapsuleGeometry(0.058, 0.24, 4, 6),
    lowerLegCapsule: new THREE.CapsuleGeometry(0.05, 0.2, 4, 6),
    sneakerBox: new THREE.BoxGeometry(0.085, 0.055, 0.15),
    soleBox: new THREE.BoxGeometry(0.09, 0.02, 0.16),
    fingerBox: new THREE.BoxGeometry(0.035, 0.02, 0.03),
    eyeSphere: new THREE.SphereGeometry(0.018, 6, 6),
    pupilSphere: new THREE.SphereGeometry(0.009, 4, 4),
    irisSphere: new THREE.SphereGeometry(0.012, 5, 5),
    eyeGlowSphere: new THREE.SphereGeometry(0.007, 4, 4),
    browBox: new THREE.BoxGeometry(0.032, 0.006, 0.008),
    skullSphere: new THREE.SphereGeometry(0.105, 8, 8),
    hairSphere: new THREE.SphereGeometry(0.09, 5, 4),
    earSphere: new THREE.SphereGeometry(0.02, 4, 4),
    noseSphere: new THREE.SphereGeometry(0.014, 4, 4),
    chinSphere: new THREE.SphereGeometry(0.028, 5, 4),
    mouthLine: new THREE.BoxGeometry(0.045, 0.004, 0.008),
    mouthCorner: new THREE.BoxGeometry(0.01, 0.004, 0.005),
    noseBridge: new THREE.BoxGeometry(0.012, 0.025, 0.01),
    neckCylinder: new THREE.CylinderGeometry(0.048, 0.055, 0.07, 6),
    jeansCuffCylinder: new THREE.CylinderGeometry(0.055, 0.052, 0.03, 6),
    /* Hair sphere geometries (many small spheres — shared to avoid per-render alloc) */
    hairFrontFringe: new THREE.SphereGeometry(0.065, 5, 4),
    hairTuftLeft: new THREE.SphereGeometry(0.03, 4, 3),
    hairTuftRight: new THREE.SphereGeometry(0.028, 4, 3),
    hairTopTuft1: new THREE.SphereGeometry(0.025, 3, 3),
    hairTopTuft2: new THREE.SphereGeometry(0.022, 3, 3),
    hairTopTuft3: new THREE.SphereGeometry(0.02, 3, 3),
    hairTopTuft4: new THREE.SphereGeometry(0.02, 3, 3),
    hairBack: new THREE.SphereGeometry(0.07, 5, 4),
    hairSideLeft: new THREE.SphereGeometry(0.03, 4, 3),
    hairSideRight: new THREE.SphereGeometry(0.03, 4, 3),
    sneakerToeCap: new THREE.SphereGeometry(0.035, 4, 4, 0, Math.PI * 2, 0, Math.PI * 0.5),
  }), []);

  /* ─── Shared material instances (optimization 3) ─── */
  const sharedMat = useMemo(() => ({
    skin: new THREE.MeshStandardMaterial({ color: '#c4a882', roughness: 0.7, metalness: 0.05 }),
    skinShadow: new THREE.MeshStandardMaterial({ color: '#b89a72', roughness: 0.7 }),
    hair: new THREE.MeshStandardMaterial({ color: '#2a1e12', roughness: 0.9, metalness: 0.05 }),
    hoodie: new THREE.MeshStandardMaterial({ color: '#2a2a3a', roughness: 0.85, metalness: 0.05, emissive: new THREE.Color('#0a0a15'), emissiveIntensity: 0.1 }),
    hoodieDark: new THREE.MeshStandardMaterial({ color: '#222233', roughness: 0.9, metalness: 0.02 }),
    jeans: new THREE.MeshStandardMaterial({ color: '#3a4050', roughness: 0.85, metalness: 0.05 }),
    jeansDark: new THREE.MeshStandardMaterial({ color: '#2e3545', roughness: 0.85 }),
    sneaker: new THREE.MeshStandardMaterial({ color: '#1a1a1a', roughness: 0.9, metalness: 0.05 }),
    sole: new THREE.MeshStandardMaterial({ color: '#e8e0d8', roughness: 0.95 }),
    bagStrap: new THREE.MeshStandardMaterial({ color: '#3d3525', roughness: 0.7, metalness: 0.1 }),
    bag: new THREE.MeshStandardMaterial({ color: '#332d20', roughness: 0.75, metalness: 0.08 }),
    eyeWhite: new THREE.MeshStandardMaterial({ color: '#f0eeea', roughness: 0.3, metalness: 0.1 }),
    pupil: new THREE.MeshStandardMaterial({ color: '#1e100a', roughness: 0.2, metalness: 0.3 }),
    iris: new THREE.MeshStandardMaterial({ color: '#4a3520', roughness: 0.4, metalness: 0.2 }),
    eyeGlow: new THREE.MeshStandardMaterial({ color: '#00ccdd', emissive: new THREE.Color('#00ccdd'), emissiveIntensity: 0.35, transparent: true, opacity: 0.5 }),
    brow: new THREE.MeshStandardMaterial({ color: '#2a1e12', roughness: 0.8 }),
    mouth: new THREE.MeshStandardMaterial({ color: '#8a6a52', roughness: 0.8 }),
    stubble: new THREE.MeshStandardMaterial({ color: '#b89a72', roughness: 0.9, transparent: true, opacity: 0.3 }),
    hoodInside: new THREE.MeshStandardMaterial({ color: '#2a2a3a', roughness: 0.85, metalness: 0.05, side: THREE.DoubleSide }),
    noseTip: new THREE.MeshStandardMaterial({ color: '#b89a72', roughness: 0.7, metalness: 0.05 }),
  }), []);

  /* ─── Dispose shared geometries and materials on unmount ─── */
  useEffect(() => {
    return () => {
      Object.values(sharedGeo).forEach(g => g.dispose());
      Object.values(sharedMat).forEach(m => m.dispose());
    };
  }, []);

  /* ─── Karma-dependent materials (optimization 5) ─── */
  const karmaMat = useMemo(() => ({
    phoneGlow: new THREE.MeshStandardMaterial({
      color: karmaGlow,
      emissive: karmaGlow,
      emissiveIntensity: 0.4,
      roughness: 0.3,
      transparent: true,
      opacity: 0.6,
    }),
    wristbandGlow: new THREE.MeshStandardMaterial({
      color: karmaGlow,
      emissive: karmaGlow,
      emissiveIntensity: 0.6,
      roughness: 0.3,
      metalness: 0.4,
    }),
    sneakerStripeGlow: new THREE.MeshStandardMaterial({
      color: karmaGlow,
      emissive: karmaGlow,
      emissiveIntensity: 0.15,
      roughness: 0.5,
      transparent: true,
      opacity: 0.5,
    }),
    sneakerSoleGlow: new THREE.MeshStandardMaterial({
      color: karmaGlow,
      emissive: karmaGlow,
      emissiveIntensity: 0.12,
      transparent: true,
      opacity: 0.3,
    }),
    torusGlowGeo: new THREE.TorusGeometry(0.034, 0.006, 4, 8),
  }), [karmaGlow]);

  /* ─── Dispose karma-dependent materials on unmount or karmaGlow change ─── */
  useEffect(() => {
    return () => {
      karmaMat.phoneGlow.dispose();
      karmaMat.wristbandGlow.dispose();
      karmaMat.sneakerStripeGlow.dispose();
      karmaMat.sneakerSoleGlow.dispose();
      karmaMat.torusGlowGeo.dispose();
    };
  }, [karmaMat]);

  return (
    <group ref={groupRef} scale={[modelScale, modelScale, modelScale]}>

      {/* TORSO GROUP */}
      <group name="torso" position={[0, 1.05, 0.02]} rotation={[0.06, 0, 0]}>

        {/* Hoodie body */}
        <mesh name="hoodieBody" castShadow material={sharedMat.hoodie}>
          <boxGeometry args={[0.40, 0.48, 0.24]} />
        </mesh>

        {/* Hoodie kangaroo pocket */}
        <mesh position={[0, -0.12, 0.125]} castShadow material={sharedMat.hoodieDark}>
          <boxGeometry args={[0.26, 0.10, 0.015]} />
        </mesh>

        {/* Hoodie pocket opening slit */}
        <mesh position={[0, -0.07, 0.132]} material={sharedMat.hoodie}>
          <boxGeometry args={[0.18, 0.005, 0.005]} />
        </mesh>

        {/* Hood (down, behind neck) */}
        <mesh position={[0, 0.22, -0.06]} rotation={[-0.3, 0, 0]} castShadow material={sharedMat.hoodInside}>
          <sphereGeometry args={[0.13, 6, 4, 0, Math.PI * 2, 0, Math.PI * 0.6]} />
        </mesh>

        {/* Hoodie collar rim */}
        <mesh position={[0, 0.2, 0.04]} rotation={[0.4, 0, 0]} material={sharedMat.hoodieDark}>
          <torusGeometry args={[0.08, 0.02, 4, 8, Math.PI]} />
        </mesh>

        {/* Laptop bag strap */}
        <mesh position={[0, 0.0, 0.125]} rotation={[0, 0, 0.45]} castShadow material={sharedMat.bagStrap}>
          <boxGeometry args={[0.025, 0.52, 0.008]} />
        </mesh>

        {/* Bag body */}
        <mesh position={[-0.18, -0.15, 0.08]} castShadow material={sharedMat.bag}>
          <boxGeometry args={[0.14, 0.18, 0.06]} />
        </mesh>

        {/* Bag flap */}
        <mesh position={[-0.18, -0.07, 0.11]} material={sharedMat.bagStrap}>
          <boxGeometry args={[0.14, 0.03, 0.01]} />
        </mesh>

        {/* Phone glow in pocket (karma-dependent) */}
        <mesh position={[0.08, -0.12, 0.128]} material={karmaMat.phoneGlow}>
          <boxGeometry args={[0.04, 0.06, 0.003]} />
        </mesh>

        {/* Neck */}
        <mesh position={[0, 0.27, 0]} geometry={sharedGeo.neckCylinder} material={sharedMat.skin} />

        {/* HEAD GROUP */}
        <group name="head" position={[0, 0.47, 0.02]}>

          {/* Skull */}
          <mesh name="skull" castShadow geometry={sharedGeo.skullSphere} material={sharedMat.skin} />

          {/* Jaw / lower face */}
          <mesh position={[0, -0.055, 0.025]} castShadow material={sharedMat.skin}>
            <boxGeometry args={[0.155, 0.055, 0.11]} />
          </mesh>

          {/* Jaw taper */}
          <mesh position={[0, -0.075, 0.03]} rotation={[0.2, 0, 0]} material={sharedMat.skin}>
            <boxGeometry args={[0.12, 0.03, 0.09]} />
          </mesh>

          {/* Chin */}
          <mesh position={[0, -0.085, 0.045]} geometry={sharedGeo.chinSphere} material={sharedMat.skin} />

          {/* Stubble shadow */}
          <mesh position={[0, -0.06, 0.065]} material={sharedMat.stubble}>
            <boxGeometry args={[0.14, 0.04, 0.005]} />
          </mesh>

          {/* Left eye */}
          <mesh position={[-0.038, 0.015, 0.092]} geometry={sharedGeo.eyeSphere} material={sharedMat.eyeWhite}>
            <mesh position={[0, 0, 0.014]} geometry={sharedGeo.pupilSphere} material={sharedMat.pupil} />
            <mesh position={[0, 0, 0.012]} geometry={sharedGeo.irisSphere} material={sharedMat.iris} />
            <mesh position={[0, 0, 0.016]} geometry={sharedGeo.eyeGlowSphere} material={sharedMat.eyeGlow} />
          </mesh>

          {/* Right eye */}
          <mesh position={[0.038, 0.015, 0.092]} geometry={sharedGeo.eyeSphere} material={sharedMat.eyeWhite}>
            <mesh position={[0, 0, 0.014]} geometry={sharedGeo.pupilSphere} material={sharedMat.pupil} />
            <mesh position={[0, 0, 0.012]} geometry={sharedGeo.irisSphere} material={sharedMat.iris} />
            <mesh position={[0, 0, 0.016]} geometry={sharedGeo.eyeGlowSphere} material={sharedMat.eyeGlow} />
          </mesh>

          {/* Left eyebrow */}
          <mesh position={[-0.038, 0.035, 0.095]} rotation={[0, 0, 0.1]} geometry={sharedGeo.browBox} material={sharedMat.brow} />

          {/* Right eyebrow */}
          <mesh position={[0.038, 0.035, 0.095]} rotation={[0, 0, -0.1]} geometry={sharedGeo.browBox} material={sharedMat.brow} />

          {/* Nose bump */}
          <mesh position={[0, -0.008, 0.105]} geometry={sharedGeo.noseSphere} material={sharedMat.noseTip} />

          {/* Nose bridge */}
          <mesh position={[0, 0.008, 0.1]} geometry={sharedGeo.noseBridge} material={sharedMat.skin} />

          {/* Mouth line */}
          <mesh position={[0, -0.035, 0.095]} geometry={sharedGeo.mouthLine} material={sharedMat.mouth} />

          {/* Mouth corners */}
          <mesh position={[-0.025, -0.032, 0.094]} rotation={[0, 0, -0.3]} geometry={sharedGeo.mouthCorner} material={sharedMat.mouth} />
          <mesh position={[0.025, -0.032, 0.094]} rotation={[0, 0, 0.3]} geometry={sharedGeo.mouthCorner} material={sharedMat.mouth} />

          {/* Left ear */}
          <mesh position={[-0.1, 0.0, 0.0]} rotation={[0, -0.2, 0]} geometry={sharedGeo.earSphere} material={sharedMat.skinShadow} />

          {/* Right ear */}
          <mesh position={[0.1, 0.0, 0.0]} rotation={[0, 0.2, 0]} geometry={sharedGeo.earSphere} material={sharedMat.skinShadow} />

          {/* Hair — main volume */}
          <mesh position={[0, 0.09, -0.01]} geometry={sharedGeo.hairSphere} material={sharedMat.hair} />
          {/* Front fringe */}
          <mesh position={[0, 0.075, 0.065]} geometry={sharedGeo.hairFrontFringe} material={sharedMat.hair} />
          <mesh position={[-0.03, 0.08, 0.07]} geometry={sharedGeo.hairTuftLeft} material={sharedMat.hair} />
          <mesh position={[0.025, 0.085, 0.068]} geometry={sharedGeo.hairTuftRight} material={sharedMat.hair} />
          {/* Top tufts */}
          <mesh position={[-0.02, 0.11, -0.02]} geometry={sharedGeo.hairTopTuft1} material={sharedMat.hair} />
          <mesh position={[0.03, 0.105, -0.01]} geometry={sharedGeo.hairTopTuft2} material={sharedMat.hair} />
          <mesh position={[-0.04, 0.095, 0.01]} geometry={sharedGeo.hairTopTuft3} material={sharedMat.hair} />
          <mesh position={[0.05, 0.085, 0.0]} geometry={sharedGeo.hairTopTuft4} material={sharedMat.hair} />
          {/* Back hair */}
          <mesh position={[0, 0.06, -0.075]} geometry={sharedGeo.hairBack} material={sharedMat.hair} />
          {/* Side hair left */}
          <mesh position={[-0.085, 0.04, 0.0]} geometry={sharedGeo.hairSideLeft} material={sharedMat.hair} />
          {/* Side hair right */}
          <mesh position={[0.085, 0.04, 0.0]} geometry={sharedGeo.hairSideRight} material={sharedMat.hair} />
        </group>

        {/* LEFT ARM */}
        <group name="leftArm" position={[0.24, 0.18, 0]} rotation={[0, 0, 0.12]}>
          {/* Upper arm — hoodie sleeve */}
          <mesh position={[0, -0.14, 0]} castShadow geometry={sharedGeo.upperArmCapsule} material={sharedMat.hoodie} />
          {/* Forearm */}
          <mesh position={[0, -0.3, 0]} castShadow geometry={sharedGeo.forearmCapsule} material={sharedMat.hoodie} />
          {/* Wrist */}
          <mesh position={[0, -0.38, 0]} geometry={sharedGeo.wristCapsule} material={sharedMat.skin} />
          {/* Hand */}
          <mesh position={[0, -0.42, 0]} castShadow geometry={sharedGeo.handSphere} material={sharedMat.skin} />
          {/* Fingers */}
          <mesh position={[0, -0.45, 0.01]} geometry={sharedGeo.fingerBox} material={sharedMat.skin} />
          {/* Karma wristband (karma-dependent) */}
          <mesh position={[0, -0.395, 0]} geometry={karmaMat.torusGlowGeo} material={karmaMat.wristbandGlow} />
        </group>

        {/* RIGHT ARM */}
        <group name="rightArm" position={[-0.24, 0.18, 0]} rotation={[0, 0, -0.12]}>
          {/* Upper arm — hoodie sleeve */}
          <mesh position={[0, -0.14, 0]} castShadow geometry={sharedGeo.upperArmCapsule} material={sharedMat.hoodie} />
          {/* Forearm */}
          <mesh position={[0, -0.3, 0]} castShadow geometry={sharedGeo.forearmCapsule} material={sharedMat.hoodie} />
          {/* Wrist */}
          <mesh position={[0, -0.38, 0]} geometry={sharedGeo.wristCapsule} material={sharedMat.skin} />
          {/* Hand */}
          <mesh position={[0, -0.42, 0]} castShadow geometry={sharedGeo.handSphere} material={sharedMat.skin} />
          {/* Fingers */}
          <mesh position={[0, -0.45, 0.01]} geometry={sharedGeo.fingerBox} material={sharedMat.skin} />
        </group>

      </group>

      {/* LEFT LEG */}
      <group name="leftLeg" position={[0.09, 0.9, 0]}>
        {/* Upper leg — jeans */}
        <mesh position={[0, -0.18, 0]} castShadow geometry={sharedGeo.upperLegCapsule} material={sharedMat.jeans} />
        {/* Lower leg — jeans */}
        <mesh position={[0, -0.4, 0]} castShadow geometry={sharedGeo.lowerLegCapsule} material={sharedMat.jeans} />
        {/* Jeans cuff */}
        <mesh position={[0, -0.5, 0]} geometry={sharedGeo.jeansCuffCylinder} material={sharedMat.jeansDark} />
        {/* Sneaker body */}
        <mesh position={[0, -0.55, 0.02]} castShadow geometry={sharedGeo.sneakerBox} material={sharedMat.sneaker} />
        {/* Sneaker toe cap */}
        <mesh position={[0, -0.55, 0.085]} geometry={sharedGeo.sneakerToeCap} material={sharedMat.sneaker} />
        {/* Sneaker sole */}
        <mesh position={[0, -0.58, 0.02]} geometry={sharedGeo.soleBox} material={sharedMat.sole} />
        {/* Sneaker stripe accent (karma-dependent) */}
        <mesh position={[0.042, -0.54, 0.02]} rotation={[0, 0, 0.1]} material={karmaMat.sneakerStripeGlow}>
          <boxGeometry args={[0.005, 0.03, 0.1]} />
        </mesh>
        {/* Sneaker sole glow (karma-dependent) */}
        <mesh position={[0, -0.59, 0.02]} material={karmaMat.sneakerSoleGlow}>
          <boxGeometry args={[0.09, 0.005, 0.16]} />
        </mesh>
      </group>

      {/* RIGHT LEG */}
      <group name="rightLeg" position={[-0.09, 0.9, 0]}>
        {/* Upper leg — jeans */}
        <mesh position={[0, -0.18, 0]} castShadow geometry={sharedGeo.upperLegCapsule} material={sharedMat.jeans} />
        {/* Lower leg — jeans */}
        <mesh position={[0, -0.4, 0]} castShadow geometry={sharedGeo.lowerLegCapsule} material={sharedMat.jeans} />
        {/* Jeans cuff */}
        <mesh position={[0, -0.5, 0]} geometry={sharedGeo.jeansCuffCylinder} material={sharedMat.jeansDark} />
        {/* Sneaker body */}
        <mesh position={[0, -0.55, 0.02]} castShadow geometry={sharedGeo.sneakerBox} material={sharedMat.sneaker} />
        {/* Sneaker toe cap */}
        <mesh position={[0, -0.55, 0.085]} geometry={sharedGeo.sneakerToeCap} material={sharedMat.sneaker} />
        {/* Sneaker sole */}
        <mesh position={[0, -0.58, 0.02]} geometry={sharedGeo.soleBox} material={sharedMat.sole} />
        {/* Sneaker stripe accent (karma-dependent) */}
        <mesh position={[-0.042, -0.54, 0.02]} rotation={[0, 0, -0.1]} material={karmaMat.sneakerStripeGlow}>
          <boxGeometry args={[0.005, 0.03, 0.1]} />
        </mesh>
        {/* Sneaker sole glow (karma-dependent) */}
        <mesh position={[0, -0.59, 0.02]} material={karmaMat.sneakerSoleGlow}>
          <boxGeometry args={[0.09, 0.005, 0.16]} />
        </mesh>
      </group>

    </group>
  );
});

/** Picks lite mesh on mobile viewports (≤1024px), full detail on desktop. */
export const ProceduralPlayerModelAdaptive = memo(function ProceduralPlayerModelAdaptive(
  props: ProceduralPlayerModelProps,
) {
  const isMobile = useIsMobileVisual();
  return isMobile ? <ProceduralPlayerModelLite {...props} /> : <ProceduralPlayerModel {...props} />;
});
