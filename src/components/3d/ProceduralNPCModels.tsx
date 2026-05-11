'use client';

/* ─── Volodka RPG – Unique Procedural Humanoid NPC Models
     Each of the 7 NPCs has a distinct silhouette, clothing, accessories,
     and idle/walk/talk animations built entirely from Three.js primitives.
     Quality matches the ProceduralPlayerModel in PhysicsPlayer.tsx. ─── */

import { useRef, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import type { NPCAppearance } from '@/shared/types/game';
import { InteractionState } from '@/engine/interaction/interactionMachine';

/* ─── Shared color constants ─── */
const SKIN_LIGHT = '#c4a882';
const SKIN_MEDIUM = '#b09070';
const SKIN_DARK = '#8a6a50';
const SKIN_SHADOW_LIGHT = '#b89a72';
const SKIN_SHADOW_MED = '#9a7a60';
const EYE_WHITE = '#f0eeea';
const PUPIL = '#1e100a';
const MOUTH = '#8a6a52';
const BROW = '#2a1e12';
const HAIR_DARK = '#2a1e12';
const HAIR_BROWN = '#4a3020';
const HAIR_GRAY = '#888890';
const HAIR_BLACK = '#0e0a08';

/* ─── Shared body parts ─── */

/** Reusable eye cluster (both eyes with pupils, iris, eyebrows) */
function Eyes({
  color = EYE_WHITE,
  pupilColor = PUPIL,
  browColor = BROW,
  browAngle = 0.1,
  irisColor = '#4a3520',
}: {
  color?: string;
  pupilColor?: string;
  browColor?: string;
  browAngle?: number;
  irisColor?: string;
}) {
  return (
    <>
      {/* Left eye */}
      <mesh position={[-0.038, 0.015, 0.092]}>
        <sphereGeometry args={[0.018, 6, 6]} />
        <meshStandardMaterial color={color} roughness={0.3} metalness={0.1} />
        <mesh position={[0, 0, 0.014]}>
          <sphereGeometry args={[0.009, 4, 4]} />
          <meshStandardMaterial color={pupilColor} roughness={0.2} metalness={0.3} />
        </mesh>
        <mesh position={[0, 0, 0.012]}>
          <sphereGeometry args={[0.012, 5, 5]} />
          <meshStandardMaterial color={irisColor} roughness={0.4} metalness={0.2} />
        </mesh>
      </mesh>
      {/* Right eye */}
      <mesh position={[0.038, 0.015, 0.092]}>
        <sphereGeometry args={[0.018, 6, 6]} />
        <meshStandardMaterial color={color} roughness={0.3} metalness={0.1} />
        <mesh position={[0, 0, 0.014]}>
          <sphereGeometry args={[0.009, 4, 4]} />
          <meshStandardMaterial color={pupilColor} roughness={0.2} metalness={0.3} />
        </mesh>
        <mesh position={[0, 0, 0.012]}>
          <sphereGeometry args={[0.012, 5, 5]} />
          <meshStandardMaterial color={irisColor} roughness={0.4} metalness={0.2} />
        </mesh>
      </mesh>
      {/* Left eyebrow */}
      <mesh position={[-0.038, 0.035, 0.095]} rotation={[0, 0, browAngle]}>
        <boxGeometry args={[0.032, 0.006, 0.008]} />
        <meshStandardMaterial color={browColor} roughness={0.8} />
      </mesh>
      {/* Right eyebrow */}
      <mesh position={[0.038, 0.035, 0.095]} rotation={[0, 0, -browAngle]}>
        <boxGeometry args={[0.032, 0.006, 0.008]} />
        <meshStandardMaterial color={browColor} roughness={0.8} />
      </mesh>
    </>
  );
}

/** Nose, mouth, chin, ears */
function FaceFeatures({
  skinColor = SKIN_LIGHT,
  shadowColor = SKIN_SHADOW_LIGHT,
  mouthColor = MOUTH,
  mouthWidth = 0.045,
  mouthCornersDown = true,
}: {
  skinColor?: string;
  shadowColor?: string;
  mouthColor?: string;
  mouthWidth?: number;
  mouthCornersDown?: boolean;
}) {
  return (
    <>
      {/* Nose bridge */}
      <mesh position={[0, 0.008, 0.1]}>
        <boxGeometry args={[0.012, 0.025, 0.01]} />
        <meshStandardMaterial color={skinColor} roughness={0.7} />
      </mesh>
      {/* Nose tip */}
      <mesh position={[0, -0.008, 0.105]}>
        <sphereGeometry args={[0.014, 4, 4]} />
        <meshStandardMaterial color={shadowColor} roughness={0.7} metalness={0.05} />
      </mesh>
      {/* Mouth line */}
      <mesh position={[0, -0.035, 0.095]}>
        <boxGeometry args={[mouthWidth, 0.004, 0.008]} />
        <meshStandardMaterial color={mouthColor} roughness={0.8} />
      </mesh>
      {mouthCornersDown && (
        <>
          <mesh position={[-0.025, -0.032, 0.094]} rotation={[0, 0, -0.3]}>
            <boxGeometry args={[0.01, 0.004, 0.005]} />
            <meshStandardMaterial color={mouthColor} roughness={0.8} />
          </mesh>
          <mesh position={[0.025, -0.032, 0.094]} rotation={[0, 0, 0.3]}>
            <boxGeometry args={[0.01, 0.004, 0.005]} />
            <meshStandardMaterial color={mouthColor} roughness={0.8} />
          </mesh>
        </>
      )}
      {/* Chin */}
      <mesh position={[0, -0.085, 0.045]}>
        <sphereGeometry args={[0.028, 5, 4]} />
        <meshStandardMaterial color={skinColor} roughness={0.7} metalness={0.05} />
      </mesh>
      {/* Left ear */}
      <mesh position={[-0.1, 0.0, 0.0]} rotation={[0, -0.2, 0]}>
        <sphereGeometry args={[0.02, 4, 4]} />
        <meshStandardMaterial color={shadowColor} roughness={0.7} />
      </mesh>
      {/* Right ear */}
      <mesh position={[0.1, 0.0, 0.0]} rotation={[0, 0.2, 0]}>
        <sphereGeometry args={[0.02, 4, 4]} />
        <meshStandardMaterial color={shadowColor} roughness={0.7} />
      </mesh>
    </>
  );
}

/** Arms with clothing and hands */
function Arms({
  sleeveColor,
  skinColor = SKIN_LIGHT,
  armWidth = 0.048,
  forearmWidth = 0.042,
  wristAccessory,
}: {
  sleeveColor: string;
  skinColor?: string;
  armWidth?: number;
  forearmWidth?: number;
  wristAccessory?: React.ReactNode;
}) {
  return (
    <>
      {/* Left arm */}
      <group name="leftArm" position={[0.24, 0.18, 0]} rotation={[0, 0, 0.12]}>
        <mesh position={[0, -0.14, 0]} castShadow>
          <capsuleGeometry args={[armWidth, 0.18, 4, 6]} />
          <meshStandardMaterial color={sleeveColor} roughness={0.85} metalness={0.05} />
        </mesh>
        <mesh position={[0, -0.3, 0]} castShadow>
          <capsuleGeometry args={[forearmWidth, 0.14, 4, 6]} />
          <meshStandardMaterial color={sleeveColor} roughness={0.85} metalness={0.05} />
        </mesh>
        <mesh position={[0, -0.38, 0]}>
          <capsuleGeometry args={[0.032, 0.03, 3, 5]} />
          <meshStandardMaterial color={skinColor} roughness={0.7} />
        </mesh>
        <mesh position={[0, -0.42, 0]} castShadow>
          <sphereGeometry args={[0.028, 5, 4]} />
          <meshStandardMaterial color={skinColor} roughness={0.7} metalness={0.05} />
        </mesh>
        <mesh position={[0, -0.45, 0.01]}>
          <boxGeometry args={[0.035, 0.02, 0.03]} />
          <meshStandardMaterial color={skinColor} roughness={0.7} />
        </mesh>
        {wristAccessory}
      </group>
      {/* Right arm */}
      <group name="rightArm" position={[-0.24, 0.18, 0]} rotation={[0, 0, -0.12]}>
        <mesh position={[0, -0.14, 0]} castShadow>
          <capsuleGeometry args={[armWidth, 0.18, 4, 6]} />
          <meshStandardMaterial color={sleeveColor} roughness={0.85} metalness={0.05} />
        </mesh>
        <mesh position={[0, -0.3, 0]} castShadow>
          <capsuleGeometry args={[forearmWidth, 0.14, 4, 6]} />
          <meshStandardMaterial color={sleeveColor} roughness={0.85} metalness={0.05} />
        </mesh>
        <mesh position={[0, -0.38, 0]}>
          <capsuleGeometry args={[0.032, 0.03, 3, 5]} />
          <meshStandardMaterial color={skinColor} roughness={0.7} />
        </mesh>
        <mesh position={[0, -0.42, 0]} castShadow>
          <sphereGeometry args={[0.028, 5, 4]} />
          <meshStandardMaterial color={skinColor} roughness={0.7} metalness={0.05} />
        </mesh>
        <mesh position={[0, -0.45, 0.01]}>
          <boxGeometry args={[0.035, 0.02, 0.03]} />
          <meshStandardMaterial color={skinColor} roughness={0.7} />
        </mesh>
      </group>
    </>
  );
}

/** Legs with shoes */
function Legs({
  pantsColor,
  pantsDark,
  shoeColor = '#1a1a1a',
  soleColor = '#e8e0d8',
  shoeScale = 1.0,
  legWidth = 0.058,
  lowerLegWidth = 0.05,
  accentGlow,
  accentColor,
}: {
  pantsColor: string;
  pantsDark: string;
  shoeColor?: string;
  soleColor?: string;
  shoeScale?: number;
  legWidth?: number;
  lowerLegWidth?: number;
  accentGlow?: string;
  accentColor?: string;
}) {
  const sw = 0.085 * shoeScale;
  const sh = 0.055 * shoeScale;
  const sd = 0.15 * shoeScale;
  return (
    <>
      {/* Left leg */}
      <group name="leftLeg" position={[0.09, 0.9, 0]}>
        <mesh position={[0, -0.18, 0]} castShadow>
          <capsuleGeometry args={[legWidth, 0.24, 4, 6]} />
          <meshStandardMaterial color={pantsColor} roughness={0.85} metalness={0.05} />
        </mesh>
        <mesh position={[0, -0.4, 0]} castShadow>
          <capsuleGeometry args={[lowerLegWidth, 0.2, 4, 6]} />
          <meshStandardMaterial color={pantsColor} roughness={0.85} metalness={0.05} />
        </mesh>
        <mesh position={[0, -0.5, 0]}>
          <cylinderGeometry args={[0.055, 0.052, 0.03, 6]} />
          <meshStandardMaterial color={pantsDark} roughness={0.85} />
        </mesh>
        <mesh position={[0, -0.55, 0.02]} castShadow>
          <boxGeometry args={[sw, sh, sd]} />
          <meshStandardMaterial color={shoeColor} roughness={0.9} metalness={0.05} />
        </mesh>
        <mesh position={[0, -0.58, 0.02]}>
          <boxGeometry args={[sw + 0.005, 0.02, sd + 0.005]} />
          <meshStandardMaterial color={soleColor} roughness={0.95} />
        </mesh>
        {accentGlow && accentColor && (
          <mesh position={[0, -0.59, 0.02]}>
            <boxGeometry args={[sw + 0.005, 0.005, sd + 0.005]} />
            <meshStandardMaterial color={accentColor} emissive={accentGlow} emissiveIntensity={0.12} transparent opacity={0.3} />
          </mesh>
        )}
      </group>
      {/* Right leg */}
      <group name="rightLeg" position={[-0.09, 0.9, 0]}>
        <mesh position={[0, -0.18, 0]} castShadow>
          <capsuleGeometry args={[legWidth, 0.24, 4, 6]} />
          <meshStandardMaterial color={pantsColor} roughness={0.85} metalness={0.05} />
        </mesh>
        <mesh position={[0, -0.4, 0]} castShadow>
          <capsuleGeometry args={[lowerLegWidth, 0.2, 4, 6]} />
          <meshStandardMaterial color={pantsColor} roughness={0.85} metalness={0.05} />
        </mesh>
        <mesh position={[0, -0.5, 0]}>
          <cylinderGeometry args={[0.055, 0.052, 0.03, 6]} />
          <meshStandardMaterial color={pantsDark} roughness={0.85} />
        </mesh>
        <mesh position={[0, -0.55, 0.02]} castShadow>
          <boxGeometry args={[sw, sh, sd]} />
          <meshStandardMaterial color={shoeColor} roughness={0.9} metalness={0.05} />
        </mesh>
        <mesh position={[0, -0.58, 0.02]}>
          <boxGeometry args={[sw + 0.005, 0.02, sd + 0.005]} />
          <meshStandardMaterial color={soleColor} roughness={0.95} />
        </mesh>
        {accentGlow && accentColor && (
          <mesh position={[0, -0.59, 0.02]}>
            <boxGeometry args={[sw + 0.005, 0.005, sd + 0.005]} />
            <meshStandardMaterial color={accentColor} emissive={accentGlow} emissiveIntensity={0.12} transparent opacity={0.3} />
          </mesh>
        )}
      </group>
    </>
  );
}

/* ─── Animation hook shared by all procedural NPC models ─── */
function useNPCAnimation(
  groupRef: React.RefObject<THREE.Group | null>,
  animState: 'idle' | 'walk' | 'talk',
  bodyLeanX = 0.06,
) {
  const animTimeRef = useRef(0);
  // Use useEffect to sync animState into a ref for useFrame access
  const animStateRef = useRef(animState);
  useEffect(() => {
    animStateRef.current = animState;
  }, [animState]);

  useFrame((_, delta) => {
    if (!groupRef.current) return;
    const dt = Math.min(delta, 0.05);
    animTimeRef.current += dt;
    const t = animTimeRef.current;
    const body = groupRef.current;
    const currentAnimState = animStateRef.current;

    const head = body.getObjectByName('head') as THREE.Group | undefined;
    const torso = body.getObjectByName('torso') as THREE.Group | undefined;
    const leftArm = body.getObjectByName('leftArm') as THREE.Group | undefined;
    const rightArm = body.getObjectByName('rightArm') as THREE.Group | undefined;
    const leftLeg = body.getObjectByName('leftLeg') as THREE.Group | undefined;
    const rightLeg = body.getObjectByName('rightLeg') as THREE.Group | undefined;

    if (currentAnimState === 'walk') {
      const speed = 8;
      if (torso) {
        torso.position.y = 1.05 + Math.abs(Math.sin(t * speed)) * 0.018;
        torso.rotation.x = bodyLeanX + Math.sin(t * speed * 0.5) * 0.015;
      }
      if (leftArm) {
        leftArm.rotation.x = Math.sin(t * speed) * 0.4;
        leftArm.rotation.z = 0.12 + Math.sin(t * speed) * 0.03;
      }
      if (rightArm) {
        rightArm.rotation.x = -Math.sin(t * speed) * 0.4;
        rightArm.rotation.z = -0.12 - Math.sin(t * speed) * 0.03;
      }
      if (leftLeg) leftLeg.rotation.x = -Math.sin(t * speed) * 0.4;
      if (rightLeg) rightLeg.rotation.x = Math.sin(t * speed) * 0.4;
      if (head) {
        head.rotation.x = Math.sin(t * speed) * 0.02;
        head.rotation.z = Math.sin(t * speed * 0.5) * 0.015;
      }
    } else if (currentAnimState === 'talk') {
      /* ── Talking: animated gestures, head nods ── */
      if (torso) {
        torso.position.y = 1.05 + Math.sin(t * 2.0) * 0.004;
        torso.rotation.x = bodyLeanX * 0.5 + Math.sin(t * 1.5) * 0.01;
      }
      if (head) {
        head.rotation.x = Math.sin(t * 3.0) * 0.03;
        head.rotation.z = Math.sin(t * 1.8) * 0.02;
      }
      // Right hand gestures while talking
      if (leftArm) {
        leftArm.rotation.x = Math.sin(t * 1.2) * 0.05;
        leftArm.rotation.z = 0.12 + Math.sin(t * 0.7) * 0.02;
      }
      if (rightArm) {
        rightArm.rotation.x = -0.5 + Math.sin(t * 2.5) * 0.2;
        rightArm.rotation.z = -0.2 + Math.sin(t * 2.5) * 0.1;
      }
      if (leftLeg) leftLeg.rotation.x = Math.sin(t * 0.6) * 0.01;
      if (rightLeg) rightLeg.rotation.x = Math.sin(t * 0.6 + Math.PI) * 0.01;
    } else {
      /* ── Idle: breathing, weight shift ── */
      if (torso) {
        torso.position.y = 1.05 + Math.sin(t * 2.0) * 0.004;
        torso.rotation.x = bodyLeanX + Math.sin(t * 1.5) * 0.008;
      }
      if (head) {
        head.rotation.x = Math.sin(t * 1.2) * 0.01;
        head.rotation.z = Math.sin(t * 0.8) * 0.015;
      }
      if (leftArm) {
        leftArm.rotation.x = Math.sin(t * 1.0) * 0.03;
        leftArm.rotation.z = 0.12 + Math.sin(t * 0.7) * 0.02;
      }
      if (rightArm) {
        rightArm.rotation.x = Math.sin(t * 1.0 + 0.5) * 0.03;
        rightArm.rotation.z = -0.12 - Math.sin(t * 0.7 + 0.3) * 0.02;
      }
      if (leftLeg) leftLeg.rotation.x = Math.sin(t * 0.6) * 0.01;
      if (rightLeg) rightLeg.rotation.x = Math.sin(t * 0.6 + Math.PI) * 0.01;
    }
  });
}

/* ═══════════════════════════════════════════════════════════════════
    1. ALBERT – Older professor, heavy build, glasses, tweed jacket, bow tie
    ═══════════════════════════════════════════════════════════════════ */
function AlbertModel({ appearance, animState = 'idle' }: { appearance: NPCAppearance; animState?: 'idle' | 'walk' | 'talk' }) {
  const groupRef = useRef<THREE.Group>(null);
  useNPCAnimation(groupRef, animState, 0.04); // Slight forward lean (scholarly)

  const bodyColor = appearance.bodyColor; // '#8b6914'
  const accentColor = appearance.accentColor; // '#d4a030'
  const glowColor = appearance.glowColor; // '#d4920a'

  const tweedJacket = bodyColor;
  const tweedDark = '#6a5010';
  const shirtColor = '#e8e0d0';
  const bowTieColor = accentColor;
  const pantsColor = '#4a4030';
  const pantsDark = '#3a3020';

  return (
    <group ref={groupRef}>
      {/* TORSO — broader, heavier build */}
      <group name="torso" position={[0, 1.05, 0.02]} rotation={[0.04, 0, 0]}>
        {/* Tweed jacket body — wider for heavy build */}
        <mesh castShadow>
          <boxGeometry args={[0.46, 0.50, 0.26]} />
          <meshStandardMaterial color={tweedJacket} emissive={glowColor} emissiveIntensity={0.06} roughness={0.85} metalness={0.05} />
        </mesh>
        {/* Jacket lapels — V-shape in front */}
        <mesh position={[-0.06, 0.12, 0.135]} rotation={[0, 0, 0.25]}>
          <boxGeometry args={[0.05, 0.16, 0.01]} />
          <meshStandardMaterial color={tweedDark} roughness={0.8} />
        </mesh>
        <mesh position={[0.06, 0.12, 0.135]} rotation={[0, 0, -0.25]}>
          <boxGeometry args={[0.05, 0.16, 0.01]} />
          <meshStandardMaterial color={tweedDark} roughness={0.8} />
        </mesh>
        {/* Shirt visible between lapels */}
        <mesh position={[0, 0.08, 0.132]}>
          <boxGeometry args={[0.08, 0.18, 0.008]} />
          <meshStandardMaterial color={shirtColor} roughness={0.7} />
        </mesh>
        {/* Bow tie */}
        <mesh position={[0, 0.16, 0.138]}>
          <boxGeometry args={[0.07, 0.035, 0.015]} />
          <meshStandardMaterial color={bowTieColor} emissive={glowColor} emissiveIntensity={0.2} roughness={0.6} />
        </mesh>
        {/* Bow tie center knot */}
        <mesh position={[0, 0.16, 0.142]}>
          <sphereGeometry args={[0.012, 4, 4]} />
          <meshStandardMaterial color={bowTieColor} roughness={0.6} />
        </mesh>
        {/* Jacket pockets */}
        <mesh position={[-0.12, -0.08, 0.132]}>
          <boxGeometry args={[0.06, 0.005, 0.008]} />
          <meshStandardMaterial color={tweedDark} roughness={0.8} />
        </mesh>
        <mesh position={[0.12, -0.08, 0.132]}>
          <boxGeometry args={[0.06, 0.005, 0.008]} />
          <meshStandardMaterial color={tweedDark} roughness={0.8} />
        </mesh>
        {/* Elbow patches on jacket */}
        <mesh position={[0.24, -0.1, -0.06]} rotation={[0.3, 0, 0]}>
          <circleGeometry args={[0.04, 8]} />
          <meshStandardMaterial color={tweedDark} roughness={0.8} />
        </mesh>
        <mesh position={[-0.24, -0.1, -0.06]} rotation={[0.3, 0, 0]}>
          <circleGeometry args={[0.04, 8]} />
          <meshStandardMaterial color={tweedDark} roughness={0.8} />
        </mesh>

        {/* Neck */}
        <mesh position={[0, 0.27, 0]}>
          <cylinderGeometry args={[0.055, 0.06, 0.07, 6]} />
          <meshStandardMaterial color={SKIN_MEDIUM} roughness={0.7} />
        </mesh>

        {/* HEAD */}
        <group name="head" position={[0, 0.47, 0.02]}>
          {/* Skull — slightly larger for older professor */}
          <mesh castShadow>
            <sphereGeometry args={[0.11, 8, 8]} />
            <meshStandardMaterial color={SKIN_MEDIUM} roughness={0.7} metalness={0.05} />
          </mesh>
          {/* Jaw — heavier */}
          <mesh position={[0, -0.055, 0.025]} castShadow>
            <boxGeometry args={[0.16, 0.06, 0.11]} />
            <meshStandardMaterial color={SKIN_MEDIUM} roughness={0.7} />
          </mesh>
          {/* Jaw taper */}
          <mesh position={[0, -0.075, 0.03]} rotation={[0.2, 0, 0]}>
            <boxGeometry args={[0.12, 0.03, 0.09]} />
            <meshStandardMaterial color={SKIN_MEDIUM} roughness={0.7} />
          </mesh>
          <Eyes browAngle={0.15} />
          <FaceFeatures skinColor={SKIN_MEDIUM} shadowColor={SKIN_SHADOW_MED} mouthWidth={0.04} />
          {/* Stubble */}
          <mesh position={[0, -0.06, 0.065]}>
            <boxGeometry args={[0.14, 0.05, 0.005]} />
            <meshStandardMaterial color={SKIN_SHADOW_MED} roughness={0.9} transparent opacity={0.2} />
          </mesh>

          {/* Glasses — round, scholarly */}
          <group position={[0, 0.015, 0.1]}>
            {/* Left lens */}
            <mesh position={[-0.04, 0, 0]}>
              <torusGeometry args={[0.025, 0.003, 6, 12]} />
              <meshStandardMaterial color={accentColor} emissive={glowColor} emissiveIntensity={0.3} roughness={0.2} metalness={0.8} />
            </mesh>
            {/* Right lens */}
            <mesh position={[0.04, 0, 0]}>
              <torusGeometry args={[0.025, 0.003, 6, 12]} />
              <meshStandardMaterial color={accentColor} emissive={glowColor} emissiveIntensity={0.3} roughness={0.2} metalness={0.8} />
            </mesh>
            {/* Bridge */}
            <mesh position={[0, 0, 0]}>
              <boxGeometry args={[0.02, 0.004, 0.003]} />
              <meshStandardMaterial color={accentColor} roughness={0.3} metalness={0.9} />
            </mesh>
            {/* Left temple arm */}
            <mesh position={[-0.07, 0, -0.04]} rotation={[0, Math.PI * 0.15, 0]}>
              <boxGeometry args={[0.06, 0.004, 0.003]} />
              <meshStandardMaterial color={accentColor} roughness={0.3} metalness={0.9} />
            </mesh>
            {/* Right temple arm */}
            <mesh position={[0.07, 0, -0.04]} rotation={[0, -Math.PI * 0.15, 0]}>
              <boxGeometry args={[0.06, 0.004, 0.003]} />
              <meshStandardMaterial color={accentColor} roughness={0.3} metalness={0.9} />
            </mesh>
          </group>

          {/* Hair — receding gray hair */}
          <mesh position={[0, 0.09, -0.01]}>
            <sphereGeometry args={[0.085, 5, 4]} />
            <meshStandardMaterial color={HAIR_GRAY} roughness={0.9} />
          </mesh>
          {/* Sides */}
          <mesh position={[-0.075, 0.04, 0.0]}>
            <sphereGeometry args={[0.03, 4, 3]} />
            <meshStandardMaterial color={HAIR_GRAY} roughness={0.9} />
          </mesh>
          <mesh position={[0.075, 0.04, 0.0]}>
            <sphereGeometry args={[0.03, 4, 3]} />
            <meshStandardMaterial color={HAIR_GRAY} roughness={0.9} />
          </mesh>
          {/* Back */}
          <mesh position={[0, 0.06, -0.075]}>
            <sphereGeometry args={[0.07, 5, 4]} />
            <meshStandardMaterial color={HAIR_GRAY} roughness={0.9} />
          </mesh>
        </group>

        <Arms sleeveColor={tweedJacket} skinColor={SKIN_MEDIUM} armWidth={0.052} forearmWidth={0.046} />
      </group>

      <Legs pantsColor={pantsColor} pantsDark={pantsDark} shoeColor="#3a2a1a" accentGlow={glowColor} accentColor={accentColor} legWidth={0.062} lowerLegWidth={0.054} />
    </group>
  );
}

/* ═══════════════════════════════════════════════════════════════════
    2. ZAREMA – Woman, slim, elegant, headscarf, long dress/skirt, earring
    ═══════════════════════════════════════════════════════════════════ */
function ZaremaModel({ appearance, animState = 'idle' }: { appearance: NPCAppearance; animState?: 'idle' | 'walk' | 'talk' }) {
  const groupRef = useRef<THREE.Group>(null);
  useNPCAnimation(groupRef, animState, 0.03);

  const bodyColor = appearance.bodyColor; // '#3d2b50'
  const accentColor = appearance.accentColor; // '#1a8a7a'
  const glowColor = appearance.glowColor; // '#e87a9f'

  const dressColor = bodyColor;
  const dressAccent = accentColor;
  const headscarfColor = accentColor;
  const headscarfAccent = glowColor;
  const skinColor = '#c9a67a';
  const skinShadow = '#b89468';

  return (
    <group ref={groupRef}>
      {/* TORSO — slim, elegant */}
      <group name="torso" position={[0, 1.05, 0.01]} rotation={[0.03, 0, 0]}>
        {/* Dress top */}
        <mesh castShadow>
          <boxGeometry args={[0.34, 0.46, 0.20]} />
          <meshStandardMaterial color={dressColor} emissive={glowColor} emissiveIntensity={0.08} roughness={0.8} metalness={0.05} />
        </mesh>
        {/* Dress neckline — decorative border */}
        <mesh position={[0, 0.2, 0.105]} rotation={[0.3, 0, 0]}>
          <boxGeometry args={[0.28, 0.015, 0.01]} />
          <meshStandardMaterial color={dressAccent} emissive={glowColor} emissiveIntensity={0.3} roughness={0.5} />
        </mesh>
        {/* Belt / sash at waist */}
        <mesh position={[0, -0.02, 0.105]}>
          <boxGeometry args={[0.35, 0.03, 0.01]} />
          <meshStandardMaterial color={dressAccent} emissive={glowColor} emissiveIntensity={0.15} roughness={0.6} />
        </mesh>

        {/* Long skirt (overlapping legs) — A-line shape */}
        <mesh position={[0, -0.45, 0]} castShadow>
          <cylinderGeometry args={[0.17, 0.26, 0.7, 8]} />
          <meshStandardMaterial color={dressColor} emissive={glowColor} emissiveIntensity={0.05} roughness={0.85} />
        </mesh>
        {/* Skirt decorative hem */}
        <mesh position={[0, -0.78, 0.15]} rotation={[0.5, 0, 0]}>
          <boxGeometry args={[0.45, 0.015, 0.01]} />
          <meshStandardMaterial color={dressAccent} emissive={glowColor} emissiveIntensity={0.2} roughness={0.5} />
        </mesh>

        {/* Neck — slender */}
        <mesh position={[0, 0.26, 0]}>
          <cylinderGeometry args={[0.04, 0.048, 0.06, 6]} />
          <meshStandardMaterial color={skinColor} roughness={0.7} />
        </mesh>

        {/* HEAD */}
        <group name="head" position={[0, 0.46, 0.02]}>
          {/* Skull — slightly softer, more oval */}
          <mesh castShadow>
            <sphereGeometry args={[0.10, 8, 8]} />
            <meshStandardMaterial color={skinColor} roughness={0.7} />
          </mesh>
          {/* Jaw — softer */}
          <mesh position={[0, -0.05, 0.025]} castShadow>
            <boxGeometry args={[0.14, 0.05, 0.10]} />
            <meshStandardMaterial color={skinColor} roughness={0.7} />
          </mesh>
          {/* Chin — delicate */}
          <mesh position={[0, -0.07, 0.04]}>
            <sphereGeometry args={[0.022, 4, 4]} />
            <meshStandardMaterial color={skinColor} roughness={0.7} />
          </mesh>
          <Eyes browAngle={0.05} irisColor="#3a5a40" />
          <FaceFeatures skinColor={skinColor} shadowColor={skinShadow} mouthWidth={0.035} mouthCornersDown={false} />

          {/* Headscarf — wrapped around head, draped */}
          <group position={[0, 0.05, 0]}>
            {/* Main scarf wrap */}
            <mesh position={[0, 0.04, 0]}>
              <sphereGeometry args={[0.11, 6, 5]} />
              <meshStandardMaterial color={headscarfColor} emissive={headscarfAccent} emissiveIntensity={0.1} roughness={0.8} />
            </mesh>
            {/* Scarf drape over ears */}
            <mesh position={[-0.09, -0.03, 0.02]}>
              <boxGeometry args={[0.03, 0.08, 0.06]} />
              <meshStandardMaterial color={headscarfColor} roughness={0.8} />
            </mesh>
            <mesh position={[0.09, -0.03, 0.02]}>
              <boxGeometry args={[0.03, 0.08, 0.06]} />
              <meshStandardMaterial color={headscarfColor} roughness={0.8} />
            </mesh>
            {/* Scarf tail hanging down back */}
            <mesh position={[0, -0.12, -0.08]} rotation={[-0.2, 0, 0]}>
              <boxGeometry args={[0.12, 0.2, 0.02]} />
              <meshStandardMaterial color={headscarfColor} emissive={headscarfAccent} emissiveIntensity={0.05} roughness={0.85} />
            </mesh>
            {/* Decorative pattern on scarf */}
            <mesh position={[0, 0.08, 0.08]}>
              <boxGeometry args={[0.08, 0.02, 0.01]} />
              <meshStandardMaterial color={headscarfAccent} emissive={headscarfAccent} emissiveIntensity={0.3} roughness={0.5} />
            </mesh>
          </group>

          {/* Earring — left side */}
          <group position={[0.09, -0.02, 0.04]}>
            <mesh>
              <sphereGeometry args={[0.012, 6, 6]} />
              <meshStandardMaterial color={accentColor} emissive={glowColor} emissiveIntensity={0.5} roughness={0.1} metalness={0.95} />
            </mesh>
            <mesh position={[0, -0.03, 0]}>
              <sphereGeometry args={[0.015, 6, 6]} />
              <meshStandardMaterial color={glowColor} emissive={glowColor} emissiveIntensity={0.6} roughness={0.1} metalness={0.95} />
            </mesh>
          </group>
        </group>

        {/* Arms — slim with dress sleeves */}
        <Arms sleeveColor={dressColor} skinColor={skinColor} armWidth={0.038} forearmWidth={0.034} />
      </group>

      {/* Legs hidden by long dress, just shoes visible */}
      <group name="leftLeg" position={[0.09, 0.9, 0]}>
        <mesh position={[0, -0.18, 0]}>
          <capsuleGeometry args={[0.045, 0.24, 4, 6]} />
          <meshStandardMaterial color={dressColor} roughness={0.85} />
        </mesh>
        <mesh position={[0, -0.55, 0.02]} castShadow>
          <boxGeometry args={[0.07, 0.05, 0.12]} />
          <meshStandardMaterial color="#2a1a1a" roughness={0.9} />
        </mesh>
      </group>
      <group name="rightLeg" position={[-0.09, 0.9, 0]}>
        <mesh position={[0, -0.18, 0]}>
          <capsuleGeometry args={[0.045, 0.24, 4, 6]} />
          <meshStandardMaterial color={dressColor} roughness={0.85} />
        </mesh>
        <mesh position={[0, -0.55, 0.02]} castShadow>
          <boxGeometry args={[0.07, 0.05, 0.12]} />
          <meshStandardMaterial color="#2a1a1a" roughness={0.9} />
        </mesh>
      </group>
    </group>
  );
}

/* ═══════════════════════════════════════════════════════════════════
    3. MARIA – Young woman, average build, ponytail, casual clothes, phone
    ═══════════════════════════════════════════════════════════════════ */
function MariaModel({ appearance, animState = 'idle' }: { appearance: NPCAppearance; animState?: 'idle' | 'walk' | 'talk' }) {
  const groupRef = useRef<THREE.Group>(null);
  useNPCAnimation(groupRef, animState, 0.05);

  const bodyColor = appearance.bodyColor; // '#4a5e80'
  const accentColor = appearance.accentColor; // '#a0b8d8'
  const glowColor = appearance.glowColor; // '#40d0e0'

  const jacketColor = bodyColor;
  const jacketDark = '#3a4e6a';
  const topColor = '#d0d8e8';
  const pantsColor = '#2a2a3a';
  const pantsDark = '#1e1e2a';
  const skinColor = '#d0b090';
  const skinShadow = '#c0a080';
  const hairColor = '#5a3020';

  return (
    <group ref={groupRef}>
      <group name="torso" position={[0, 1.05, 0.02]} rotation={[0.05, 0, 0]}>
        {/* Casual jacket */}
        <mesh castShadow>
          <boxGeometry args={[0.38, 0.46, 0.22]} />
          <meshStandardMaterial color={jacketColor} emissive={glowColor} emissiveIntensity={0.06} roughness={0.8} />
        </mesh>
        {/* Jacket collar turned up */}
        <mesh position={[-0.08, 0.2, 0.06]} rotation={[0, 0, 0.3]}>
          <boxGeometry args={[0.06, 0.08, 0.02]} />
          <meshStandardMaterial color={jacketDark} roughness={0.8} />
        </mesh>
        <mesh position={[0.08, 0.2, 0.06]} rotation={[0, 0, -0.3]}>
          <boxGeometry args={[0.06, 0.08, 0.02]} />
          <meshStandardMaterial color={jacketDark} roughness={0.8} />
        </mesh>
        {/* T-shirt visible under jacket */}
        <mesh position={[0, 0.1, 0.115]}>
          <boxGeometry args={[0.18, 0.12, 0.008]} />
          <meshStandardMaterial color={topColor} roughness={0.7} />
        </mesh>
        {/* Jacket zipper line */}
        <mesh position={[0, 0.0, 0.112]}>
          <boxGeometry args={[0.005, 0.46, 0.005]} />
          <meshStandardMaterial color="#888" roughness={0.3} metalness={0.8} />
        </mesh>
        {/* Jacket pockets */}
        <mesh position={[-0.1, -0.1, 0.115]}>
          <boxGeometry args={[0.08, 0.06, 0.005]} />
          <meshStandardMaterial color={jacketDark} roughness={0.8} />
        </mesh>
        <mesh position={[0.1, -0.1, 0.115]}>
          <boxGeometry args={[0.08, 0.06, 0.005]} />
          <meshStandardMaterial color={jacketDark} roughness={0.8} />
        </mesh>

        {/* Phone in right hand — glowing screen */}
        <mesh position={[-0.24, -0.28, 0.08]} rotation={[0.3, 0, 0]}>
          <boxGeometry args={[0.03, 0.05, 0.005]} />
          <meshStandardMaterial
            color={glowColor}
            emissive={glowColor}
            emissiveIntensity={0.6}
            roughness={0.2}
            transparent
            opacity={0.7}
          />
        </mesh>

        {/* Neck */}
        <mesh position={[0, 0.26, 0]}>
          <cylinderGeometry args={[0.042, 0.05, 0.06, 6]} />
          <meshStandardMaterial color={skinColor} roughness={0.7} />
        </mesh>

        {/* HEAD */}
        <group name="head" position={[0, 0.46, 0.02]}>
          <mesh castShadow>
            <sphereGeometry args={[0.10, 8, 8]} />
            <meshStandardMaterial color={skinColor} roughness={0.7} />
          </mesh>
          <mesh position={[0, -0.05, 0.025]} castShadow>
            <boxGeometry args={[0.14, 0.05, 0.10]} />
            <meshStandardMaterial color={skinColor} roughness={0.7} />
          </mesh>
          <mesh position={[0, -0.065, 0.035]}>
            <sphereGeometry args={[0.024, 4, 4]} />
            <meshStandardMaterial color={skinColor} roughness={0.7} />
          </mesh>
          <Eyes browAngle={0.06} irisColor="#4a6a8a" />
          <FaceFeatures skinColor={skinColor} shadowColor={skinShadow} mouthWidth={0.04} mouthCornersDown={false} />

          {/* Hair — brown, shoulder-length with ponytail */}
          <mesh position={[0, 0.08, -0.01]}>
            <sphereGeometry args={[0.085, 5, 4]} />
            <meshStandardMaterial color={hairColor} roughness={0.9} />
          </mesh>
          {/* Front bangs */}
          <mesh position={[0, 0.07, 0.065]}>
            <sphereGeometry args={[0.06, 5, 4]} />
            <meshStandardMaterial color={hairColor} roughness={0.9} />
          </mesh>
          {/* Side hair */}
          <mesh position={[-0.08, 0.03, 0.02]}>
            <sphereGeometry args={[0.035, 4, 3]} />
            <meshStandardMaterial color={hairColor} roughness={0.9} />
          </mesh>
          <mesh position={[0.08, 0.03, 0.02]}>
            <sphereGeometry args={[0.035, 4, 3]} />
            <meshStandardMaterial color={hairColor} roughness={0.9} />
          </mesh>
          {/* Back hair */}
          <mesh position={[0, 0.04, -0.07]}>
            <sphereGeometry args={[0.07, 5, 4]} />
            <meshStandardMaterial color={hairColor} roughness={0.9} />
          </mesh>
          {/* Ponytail */}
          <mesh position={[0, 0.0, -0.14]} rotation={[0.3, 0, 0]}>
            <capsuleGeometry args={[0.03, 0.18, 4, 6]} />
            <meshStandardMaterial color={hairColor} roughness={0.9} />
          </mesh>
          {/* Ponytail band */}
          <mesh position={[0, 0.02, -0.08]}>
            <torusGeometry args={[0.035, 0.006, 4, 8]} />
            <meshStandardMaterial color={accentColor} emissive={glowColor} emissiveIntensity={0.3} roughness={0.3} metalness={0.6} />
          </mesh>
        </group>

        <Arms sleeveColor={jacketColor} skinColor={skinColor} />
      </group>

      <Legs pantsColor={pantsColor} pantsDark={pantsDark} shoeColor="#1a1a1a" accentGlow={glowColor} accentColor={accentColor} />
    </group>
  );
}

/* ═══════════════════════════════════════════════════════════════════
    4. DMITRY – Large man, heavy build, cap/beanie, work jacket, big boots
    ═══════════════════════════════════════════════════════════════════ */
function DmitryModel({ appearance, animState = 'idle' }: { appearance: NPCAppearance; animState?: 'idle' | 'walk' | 'talk' }) {
  const groupRef = useRef<THREE.Group>(null);
  useNPCAnimation(groupRef, animState, 0.08); // More forward lean (heavy)

  const bodyColor = appearance.bodyColor; // '#2d4a2a'
  const accentColor = appearance.accentColor; // '#4a7040'
  const glowColor = appearance.glowColor; // '#6a8a30'

  const workJacket = bodyColor;
  const workJacketDark = '#1d3a1a';
  const undershirtColor = '#5a5a5a';
  const pantsColor = '#3a3525';
  const pantsDark = '#2a2515';
  const bootColor = '#2a1a0a';
  const skinColor = SKIN_MEDIUM;
  const skinShadow = SKIN_SHADOW_MED;

  return (
    <group ref={groupRef}>
      <group name="torso" position={[0, 1.05, 0.03]} rotation={[0.08, 0, 0]}>
        {/* Work jacket — broad, heavy */}
        <mesh castShadow>
          <boxGeometry args={[0.50, 0.52, 0.28]} />
          <meshStandardMaterial color={workJacket} emissive={glowColor} emissiveIntensity={0.06} roughness={0.9} metalness={0.05} />
        </mesh>
        {/* Jacket front panels */}
        <mesh position={[-0.1, 0.0, 0.145]} rotation={[0, 0, 0.05]}>
          <boxGeometry args={[0.12, 0.50, 0.01]} />
          <meshStandardMaterial color={workJacketDark} roughness={0.85} />
        </mesh>
        <mesh position={[0.1, 0.0, 0.145]} rotation={[0, 0, -0.05]}>
          <boxGeometry args={[0.12, 0.50, 0.01]} />
          <meshStandardMaterial color={workJacketDark} roughness={0.85} />
        </mesh>
        {/* Undershirt at collar */}
        <mesh position={[0, 0.18, 0.145]}>
          <boxGeometry args={[0.10, 0.10, 0.008]} />
          <meshStandardMaterial color={undershirtColor} roughness={0.7} />
        </mesh>
        {/* Work jacket pockets — utility chest pockets */}
        <mesh position={[-0.12, 0.08, 0.145]}>
          <boxGeometry args={[0.08, 0.06, 0.01]} />
          <meshStandardMaterial color={workJacketDark} roughness={0.85} />
        </mesh>
        <mesh position={[0.12, 0.08, 0.145]}>
          <boxGeometry args={[0.08, 0.06, 0.01]} />
          <meshStandardMaterial color={workJacketDark} roughness={0.85} />
        </mesh>
        {/* Side pockets with flaps */}
        <mesh position={[-0.15, -0.1, 0.145]}>
          <boxGeometry args={[0.08, 0.08, 0.01]} />
          <meshStandardMaterial color={workJacketDark} roughness={0.85} />
        </mesh>
        <mesh position={[0.15, -0.1, 0.145]}>
          <boxGeometry args={[0.08, 0.08, 0.01]} />
          <meshStandardMaterial color={workJacketDark} roughness={0.85} />
        </mesh>
        {/* Tool clip on jacket */}
        <mesh position={[0.20, 0.0, 0.12]}>
          <boxGeometry args={[0.01, 0.15, 0.02]} />
          <meshStandardMaterial color="#555" roughness={0.5} metalness={0.6} />
        </mesh>

        {/* Neck — thick */}
        <mesh position={[0, 0.28, 0]}>
          <cylinderGeometry args={[0.06, 0.065, 0.07, 6]} />
          <meshStandardMaterial color={skinColor} roughness={0.7} />
        </mesh>

        {/* HEAD */}
        <group name="head" position={[0, 0.48, 0.02]}>
          {/* Skull — wider, heavier */}
          <mesh castShadow>
            <sphereGeometry args={[0.11, 8, 8]} />
            <meshStandardMaterial color={skinColor} roughness={0.7} />
          </mesh>
          <mesh position={[0, -0.06, 0.025]} castShadow>
            <boxGeometry args={[0.17, 0.06, 0.12]} />
            <meshStandardMaterial color={skinColor} roughness={0.7} />
          </mesh>
          <mesh position={[0, -0.08, 0.035]}>
            <sphereGeometry args={[0.03, 4, 4]} />
            <meshStandardMaterial color={skinColor} roughness={0.7} />
          </mesh>
          <Eyes browAngle={0.12} irisColor="#4a3a20" />
          <FaceFeatures skinColor={skinColor} shadowColor={skinShadow} mouthWidth={0.05} />
          {/* Stubble */}
          <mesh position={[0, -0.065, 0.07]}>
            <boxGeometry args={[0.15, 0.05, 0.005]} />
            <meshStandardMaterial color={skinShadow} roughness={0.9} transparent opacity={0.25} />
          </mesh>

          {/* Beanie cap */}
          <group position={[0, 0.06, 0]}>
            <mesh position={[0, 0.04, 0]}>
              <sphereGeometry args={[0.11, 6, 5, 0, Math.PI * 2, 0, Math.PI * 0.55]} />
              <meshStandardMaterial color={accentColor} emissive={glowColor} emissiveIntensity={0.1} roughness={0.9} />
            </mesh>
            {/* Beanie cuff */}
            <mesh position={[0, -0.02, 0]} rotation={[0, 0, 0]}>
              <cylinderGeometry args={[0.11, 0.11, 0.04, 8]} />
              <meshStandardMaterial color={workJacket} roughness={0.9} />
            </mesh>
          </group>

          {/* Short hair under beanie */}
          <mesh position={[0, 0.02, -0.06]}>
            <sphereGeometry args={[0.08, 5, 4]} />
            <meshStandardMaterial color={HAIR_DARK} roughness={0.9} />
          </mesh>
        </group>

        <Arms sleeveColor={workJacket} skinColor={skinColor} armWidth={0.055} forearmWidth={0.048} />
      </group>

      <Legs
        pantsColor={pantsColor}
        pantsDark={pantsDark}
        shoeColor={bootColor}
        soleColor="#1a1008"
        shoeScale={1.15}
        accentGlow={glowColor}
        accentColor={accentColor}
        legWidth={0.065}
        lowerLegWidth={0.058}
      />
    </group>
  );
}

/* ═══════════════════════════════════════════════════════════════════
    5. ALEXANDER – Middle-aged man, average build, hat, suit jacket, scarf
    ═══════════════════════════════════════════════════════════════════ */
function AlexanderModel({ appearance, animState = 'idle' }: { appearance: NPCAppearance; animState?: 'idle' | 'walk' | 'talk' }) {
  const groupRef = useRef<THREE.Group>(null);
  useNPCAnimation(groupRef, animState, 0.04);

  const bodyColor = appearance.bodyColor; // '#1c1c2a'
  const accentColor = appearance.accentColor; // '#3a3a50'
  const glowColor = appearance.glowColor; // '#cc2020'

  const suitColor = bodyColor;
  const suitDark = '#141420';
  const shirtColor = '#d8d0c8';
  const tieColor = glowColor; // Red tie — authority
  const pantsColor = '#1a1a28';
  const pantsDark = '#101018';
  const scarfColor = accentColor;
  const hatColor = '#2a2a38';
  const hatBandColor = glowColor;

  return (
    <group ref={groupRef}>
      <group name="torso" position={[0, 1.05, 0.01]} rotation={[0.04, 0, 0]}>
        {/* Suit jacket */}
        <mesh castShadow>
          <boxGeometry args={[0.40, 0.48, 0.23]} />
          <meshStandardMaterial color={suitColor} emissive={glowColor} emissiveIntensity={0.04} roughness={0.7} metalness={0.1} />
        </mesh>
        {/* Suit lapels */}
        <mesh position={[-0.06, 0.12, 0.12]} rotation={[0, 0, 0.2]}>
          <boxGeometry args={[0.05, 0.16, 0.008]} />
          <meshStandardMaterial color={suitDark} roughness={0.7} metalness={0.1} />
        </mesh>
        <mesh position={[0.06, 0.12, 0.12]} rotation={[0, 0, -0.2]}>
          <boxGeometry args={[0.05, 0.16, 0.008]} />
          <meshStandardMaterial color={suitDark} roughness={0.7} metalness={0.1} />
        </mesh>
        {/* Shirt */}
        <mesh position={[0, 0.08, 0.118]}>
          <boxGeometry args={[0.10, 0.20, 0.005]} />
          <meshStandardMaterial color={shirtColor} roughness={0.6} />
        </mesh>
        {/* Tie */}
        <mesh position={[0, 0.04, 0.122]}>
          <boxGeometry args={[0.025, 0.22, 0.006]} />
          <meshStandardMaterial color={tieColor} emissive={glowColor} emissiveIntensity={0.2} roughness={0.5} />
        </mesh>
        {/* Tie knot */}
        <mesh position={[0, 0.15, 0.122]}>
          <boxGeometry args={[0.03, 0.025, 0.008]} />
          <meshStandardMaterial color={tieColor} roughness={0.5} />
        </mesh>
        {/* Suit buttons */}
        <mesh position={[0, 0.0, 0.118]}>
          <sphereGeometry args={[0.006, 4, 4]} />
          <meshStandardMaterial color="#555" roughness={0.3} metalness={0.8} />
        </mesh>
        <mesh position={[0, -0.08, 0.118]}>
          <sphereGeometry args={[0.006, 4, 4]} />
          <meshStandardMaterial color="#555" roughness={0.3} metalness={0.8} />
        </mesh>

        {/* Scarf wrapped around neck */}
        <mesh position={[0, 0.22, 0.02]} rotation={[Math.PI * 0.5, 0, 0]}>
          <torusGeometry args={[0.08, 0.03, 6, 12]} />
          <meshStandardMaterial color={scarfColor} emissive={glowColor} emissiveIntensity={0.1} roughness={0.8} />
        </mesh>
        {/* Scarf tail */}
        <mesh position={[0.08, 0.08, 0.1]} rotation={[0, 0, -0.15]}>
          <boxGeometry args={[0.04, 0.18, 0.015]} />
          <meshStandardMaterial color={scarfColor} roughness={0.85} />
        </mesh>

        {/* Neck */}
        <mesh position={[0, 0.27, 0]}>
          <cylinderGeometry args={[0.05, 0.055, 0.07, 6]} />
          <meshStandardMaterial color={SKIN_LIGHT} roughness={0.7} />
        </mesh>

        {/* HEAD */}
        <group name="head" position={[0, 0.47, 0.02]}>
          <mesh castShadow>
            <sphereGeometry args={[0.105, 8, 8]} />
            <meshStandardMaterial color={SKIN_LIGHT} roughness={0.7} />
          </mesh>
          <mesh position={[0, -0.055, 0.025]} castShadow>
            <boxGeometry args={[0.155, 0.055, 0.11]} />
            <meshStandardMaterial color={SKIN_LIGHT} roughness={0.7} />
          </mesh>
          <mesh position={[0, -0.075, 0.035]}>
            <sphereGeometry args={[0.026, 4, 4]} />
            <meshStandardMaterial color={SKIN_LIGHT} roughness={0.7} />
          </mesh>
          <Eyes browAngle={0.08} irisColor="#3a3020" />
          <FaceFeatures skinColor={SKIN_LIGHT} shadowColor={SKIN_SHADOW_LIGHT} mouthWidth={0.04} />
          {/* Neatly trimmed hair */}
          <mesh position={[0, 0.08, -0.01]}>
            <sphereGeometry args={[0.085, 5, 4]} />
            <meshStandardMaterial color={HAIR_BROWN} roughness={0.9} />
          </mesh>
          <mesh position={[0, 0.04, -0.07]}>
            <sphereGeometry args={[0.06, 5, 4]} />
            <meshStandardMaterial color={HAIR_BROWN} roughness={0.9} />
          </mesh>
          <mesh position={[-0.08, 0.03, 0.0]}>
            <sphereGeometry args={[0.025, 4, 3]} />
            <meshStandardMaterial color={HAIR_BROWN} roughness={0.9} />
          </mesh>
          <mesh position={[0.08, 0.03, 0.0]}>
            <sphereGeometry args={[0.025, 4, 3]} />
            <meshStandardMaterial color={HAIR_BROWN} roughness={0.9} />
          </mesh>

          {/* Fedora hat */}
          <group position={[0, 0.08, 0]}>
            {/* Crown */}
            <mesh position={[0, 0.06, 0]}>
              <cylinderGeometry args={[0.09, 0.10, 0.10, 10]} />
              <meshStandardMaterial color={hatColor} roughness={0.75} />
            </mesh>
            {/* Crown indent */}
            <mesh position={[0, 0.10, 0]}>
              <cylinderGeometry args={[0.06, 0.08, 0.03, 8]} />
              <meshStandardMaterial color={hatColor} roughness={0.75} />
            </mesh>
            {/* Brim */}
            <mesh position={[0, 0.0, 0]}>
              <cylinderGeometry args={[0.17, 0.18, 0.015, 14]} />
              <meshStandardMaterial color={hatColor} roughness={0.75} />
            </mesh>
            {/* Hat band */}
            <mesh position={[0, 0.025, 0.095]}>
              <boxGeometry args={[0.19, 0.015, 0.015]} />
              <meshStandardMaterial color={hatBandColor} emissive={glowColor} emissiveIntensity={0.3} roughness={0.4} />
            </mesh>
          </group>
        </group>

        <Arms sleeveColor={suitColor} skinColor={SKIN_LIGHT} />
      </group>

      <Legs pantsColor={pantsColor} pantsDark={pantsDark} shoeColor="#1a1010" accentGlow={glowColor} accentColor={hatBandColor} />
    </group>
  );
}

/* ═══════════════════════════════════════════════════════════════════
    6. COLLEAGUE – Young man, slim, hoodie, backpack, earbuds
    ═══════════════════════════════════════════════════════════════════ */
function ColleagueModel({ appearance, animState = 'idle' }: { appearance: NPCAppearance; animState?: 'idle' | 'walk' | 'talk' }) {
  const groupRef = useRef<THREE.Group>(null);
  useNPCAnimation(groupRef, animState, 0.07); // Nervous forward hunch

  const bodyColor = appearance.bodyColor; // '#6b6b78'
  const accentColor = appearance.accentColor; // '#8a8a98'
  const glowColor = appearance.glowColor; // '#d0d0e0'

  const hoodieColor = bodyColor;
  const hoodieDark = '#5a5a68';
  const jeansColor = '#3a4050';
  const jeansDark = '#2e3545';
  const backpackColor = '#2a2a35';
  const backpackAccent = accentColor;
  const earbudsColor = '#e8e8e8';
  const skinColor = SKIN_LIGHT;
  const skinShadow = SKIN_SHADOW_LIGHT;
  const hairColor = HAIR_DARK;

  return (
    <group ref={groupRef}>
      <group name="torso" position={[0, 1.05, 0.03]} rotation={[0.07, 0, 0]}>
        {/* Hoodie — slim fit */}
        <mesh castShadow>
          <boxGeometry args={[0.36, 0.46, 0.22]} />
          <meshStandardMaterial color={hoodieColor} emissive={glowColor} emissiveIntensity={0.06} roughness={0.85} />
        </mesh>
        {/* Hoodie pocket */}
        <mesh position={[0, -0.12, 0.115]}>
          <boxGeometry args={[0.22, 0.08, 0.01]} />
          <meshStandardMaterial color={hoodieDark} roughness={0.9} />
        </mesh>
        {/* Hoodie drawstrings */}
        <mesh position={[-0.02, 0.15, 0.115]}>
          <boxGeometry args={[0.003, 0.12, 0.003]} />
          <meshStandardMaterial color="#ccc" roughness={0.6} />
        </mesh>
        <mesh position={[0.02, 0.12, 0.115]}>
          <boxGeometry args={[0.003, 0.10, 0.003]} />
          <meshStandardMaterial color="#ccc" roughness={0.6} />
        </mesh>
        {/* Hood (down) */}
        <mesh position={[0, 0.22, -0.06]} rotation={[-0.3, 0, 0]} castShadow>
          <sphereGeometry args={[0.12, 6, 4, 0, Math.PI * 2, 0, Math.PI * 0.6]} />
          <meshStandardMaterial color={hoodieColor} roughness={0.85} side={THREE.DoubleSide} />
        </mesh>
        {/* Hoodie zipper */}
        <mesh position={[0, 0.0, 0.112]}>
          <boxGeometry args={[0.004, 0.46, 0.004]} />
          <meshStandardMaterial color="#888" roughness={0.3} metalness={0.7} />
        </mesh>

        {/* Backpack */}
        <group position={[0, 0.05, -0.14]}>
          {/* Main body */}
          <mesh castShadow>
            <boxGeometry args={[0.24, 0.30, 0.10]} />
            <meshStandardMaterial color={backpackColor} roughness={0.8} />
          </mesh>
          {/* Top flap */}
          <mesh position={[0, 0.14, 0.02]}>
            <boxGeometry args={[0.24, 0.04, 0.12]} />
            <meshStandardMaterial color={backpackColor} roughness={0.8} />
          </mesh>
          {/* Backpack straps (visible over shoulders) */}
          <mesh position={[-0.08, 0.1, 0.06]} rotation={[0.1, 0, 0.05]}>
            <boxGeometry args={[0.03, 0.30, 0.02]} />
            <meshStandardMaterial color={backpackColor} roughness={0.8} />
          </mesh>
          <mesh position={[0.08, 0.1, 0.06]} rotation={[0.1, 0, -0.05]}>
            <boxGeometry args={[0.03, 0.30, 0.02]} />
            <meshStandardMaterial color={backpackColor} roughness={0.8} />
          </mesh>
          {/* Accent stripe on backpack */}
          <mesh position={[0, 0.0, 0.052]}>
            <boxGeometry args={[0.22, 0.02, 0.005]} />
            <meshStandardMaterial color={backpackAccent} emissive={glowColor} emissiveIntensity={0.3} roughness={0.5} />
          </mesh>
          {/* Buckle */}
          <mesh position={[0, 0.12, 0.055]}>
            <boxGeometry args={[0.04, 0.02, 0.01]} />
            <meshStandardMaterial color="#888" roughness={0.3} metalness={0.8} />
          </mesh>
        </group>

        {/* Neck */}
        <mesh position={[0, 0.26, 0]}>
          <cylinderGeometry args={[0.042, 0.05, 0.06, 6]} />
          <meshStandardMaterial color={skinColor} roughness={0.7} />
        </mesh>

        {/* HEAD */}
        <group name="head" position={[0, 0.46, 0.02]}>
          <mesh castShadow>
            <sphereGeometry args={[0.10, 8, 8]} />
            <meshStandardMaterial color={skinColor} roughness={0.7} />
          </mesh>
          <mesh position={[0, -0.05, 0.025]} castShadow>
            <boxGeometry args={[0.14, 0.05, 0.10]} />
            <meshStandardMaterial color={skinColor} roughness={0.7} />
          </mesh>
          <mesh position={[0, -0.065, 0.035]}>
            <sphereGeometry args={[0.024, 4, 4]} />
            <meshStandardMaterial color={skinColor} roughness={0.7} />
          </mesh>
          <Eyes browAngle={0.08} irisColor="#3a4a3a" />
          <FaceFeatures skinColor={skinColor} shadowColor={skinShadow} mouthWidth={0.038} />

          {/* Earbuds — white cords and buds */}
          {/* Left earbud */}
          <mesh position={[-0.09, 0.0, 0.02]}>
            <sphereGeometry args={[0.012, 5, 5]} />
            <meshStandardMaterial color={earbudsColor} roughness={0.3} metalness={0.2} />
          </mesh>
          {/* Right earbud */}
          <mesh position={[0.09, 0.0, 0.02]}>
            <sphereGeometry args={[0.012, 5, 5]} />
            <meshStandardMaterial color={earbudsColor} roughness={0.3} metalness={0.2} />
          </mesh>
          {/* Earbud cord */}
          <mesh position={[-0.05, -0.04, 0.08]} rotation={[0, 0, 0.3]}>
            <boxGeometry args={[0.08, 0.003, 0.003]} />
            <meshStandardMaterial color={earbudsColor} roughness={0.5} />
          </mesh>
          <mesh position={[0.05, -0.04, 0.08]} rotation={[0, 0, -0.3]}>
            <boxGeometry args={[0.08, 0.003, 0.003]} />
            <meshStandardMaterial color={earbudsColor} roughness={0.5} />
          </mesh>

          {/* Messy hair — young guy style */}
          <mesh position={[0, 0.09, -0.01]}>
            <sphereGeometry args={[0.08, 5, 4]} />
            <meshStandardMaterial color={hairColor} roughness={0.9} />
          </mesh>
          <mesh position={[0, 0.07, 0.06]}>
            <sphereGeometry args={[0.06, 5, 4]} />
            <meshStandardMaterial color={hairColor} roughness={0.9} />
          </mesh>
          <mesh position={[-0.03, 0.09, 0.05]}>
            <sphereGeometry args={[0.03, 4, 3]} />
            <meshStandardMaterial color={hairColor} roughness={0.9} />
          </mesh>
          <mesh position={[0.03, 0.10, 0.04]}>
            <sphereGeometry args={[0.025, 4, 3]} />
            <meshStandardMaterial color={hairColor} roughness={0.9} />
          </mesh>
          <mesh position={[-0.02, 0.11, 0.0]}>
            <sphereGeometry args={[0.022, 3, 3]} />
            <meshStandardMaterial color={hairColor} roughness={0.9} />
          </mesh>
          <mesh position={[0.04, 0.09, -0.02]}>
            <sphereGeometry args={[0.02, 3, 3]} />
            <meshStandardMaterial color={hairColor} roughness={0.9} />
          </mesh>
        </group>

        <Arms sleeveColor={hoodieColor} skinColor={skinColor} armWidth={0.040} forearmWidth={0.035} />
      </group>

      <Legs pantsColor={jeansColor} pantsDark={jeansDark} accentGlow={glowColor} accentColor={accentColor} />
    </group>
  );
}

/* ═══════════════════════════════════════════════════════════════════
    7. BARISTA – Young person, average build, apron, cap, name tag
    ═══════════════════════════════════════════════════════════════════ */
function BaristaModel({ appearance, animState = 'idle' }: { appearance: NPCAppearance; animState?: 'idle' | 'walk' | 'talk' }) {
  const groupRef = useRef<THREE.Group>(null);
  useNPCAnimation(groupRef, animState, 0.04);

  const bodyColor = appearance.bodyColor; // '#a05a2c'
  const accentColor = appearance.accentColor; // '#e8822a'
  const glowColor = appearance.glowColor; // '#f0c040'

  const shirtColor = '#2a2a2a';
  const apronColor = bodyColor;
  const apronAccent = accentColor;
  const pantsColor = '#1a1a1a';
  const pantsDark = '#101010';
  const capColor = '#1a1a1a';
  const capAccent = accentColor;
  const skinColor = '#c0a080';
  const skinShadow = '#b09070';
  const hairColor = '#3a2a18';

  return (
    <group ref={groupRef}>
      <group name="torso" position={[0, 1.05, 0.02]} rotation={[0.04, 0, 0]}>
        {/* T-shirt */}
        <mesh castShadow>
          <boxGeometry args={[0.38, 0.46, 0.22]} />
          <meshStandardMaterial color={shirtColor} emissive={glowColor} emissiveIntensity={0.04} roughness={0.8} />
        </mesh>
        {/* T-shirt collar */}
        <mesh position={[0, 0.22, 0.04]} rotation={[0.3, 0, 0]}>
          <torusGeometry args={[0.06, 0.012, 4, 8, Math.PI]} />
          <meshStandardMaterial color={shirtColor} roughness={0.8} />
        </mesh>

        {/* Apron over shirt */}
        <mesh position={[0, -0.02, 0.12]} castShadow>
          <boxGeometry args={[0.36, 0.40, 0.01]} />
          <meshStandardMaterial color={apronColor} emissive={glowColor} emissiveIntensity={0.1} roughness={0.85} />
        </mesh>
        {/* Apron bib top */}
        <mesh position={[0, 0.12, 0.12]}>
          <boxGeometry args={[0.20, 0.12, 0.01]} />
          <meshStandardMaterial color={apronColor} roughness={0.85} />
        </mesh>
        {/* Apron neck strap */}
        <mesh position={[-0.08, 0.2, 0.04]} rotation={[0, 0, 0.2]}>
          <boxGeometry args={[0.01, 0.12, 0.005]} />
          <meshStandardMaterial color={apronColor} roughness={0.85} />
        </mesh>
        <mesh position={[0.08, 0.2, 0.04]} rotation={[0, 0, -0.2]}>
          <boxGeometry args={[0.01, 0.12, 0.005]} />
          <meshStandardMaterial color={apronColor} roughness={0.85} />
        </mesh>
        {/* Apron waist tie */}
        <mesh position={[0, 0.02, 0.13]}>
          <boxGeometry args={[0.38, 0.02, 0.008]} />
          <meshStandardMaterial color={apronAccent} emissive={glowColor} emissiveIntensity={0.15} roughness={0.7} />
        </mesh>
        {/* Apron waist tie bow — right side */}
        <mesh position={[0.20, 0.02, 0.13]} rotation={[0, 0, -0.3]}>
          <boxGeometry args={[0.06, 0.03, 0.008]} />
          <meshStandardMaterial color={apronAccent} roughness={0.7} />
        </mesh>
        {/* Apron pocket */}
        <mesh position={[0, -0.10, 0.128]}>
          <boxGeometry args={[0.12, 0.08, 0.005]} />
          <meshStandardMaterial color={apronAccent} roughness={0.8} />
        </mesh>

        {/* Name tag on apron */}
        <mesh position={[0.08, 0.08, 0.128]}>
          <boxGeometry args={[0.04, 0.025, 0.003]} />
          <meshStandardMaterial
            color="#ffffff"
            emissive={glowColor}
            emissiveIntensity={0.3}
            roughness={0.3}
            transparent
            opacity={0.8}
          />
        </mesh>

        {/* Neck */}
        <mesh position={[0, 0.26, 0]}>
          <cylinderGeometry args={[0.042, 0.05, 0.06, 6]} />
          <meshStandardMaterial color={skinColor} roughness={0.7} />
        </mesh>

        {/* HEAD */}
        <group name="head" position={[0, 0.46, 0.02]}>
          <mesh castShadow>
            <sphereGeometry args={[0.10, 8, 8]} />
            <meshStandardMaterial color={skinColor} roughness={0.7} />
          </mesh>
          <mesh position={[0, -0.05, 0.025]} castShadow>
            <boxGeometry args={[0.14, 0.05, 0.10]} />
            <meshStandardMaterial color={skinColor} roughness={0.7} />
          </mesh>
          <mesh position={[0, -0.065, 0.035]}>
            <sphereGeometry args={[0.024, 4, 4]} />
            <meshStandardMaterial color={skinColor} roughness={0.7} />
          </mesh>
          <Eyes browAngle={0.05} irisColor="#4a3a20" />
          <FaceFeatures skinColor={skinColor} shadowColor={skinShadow} mouthWidth={0.04} mouthCornersDown={false} />
          {/* Friendly slight upturn at mouth corners */}

          {/* Cap / visor beanie */}
          <group position={[0, 0.07, 0]}>
            {/* Cap dome */}
            <mesh position={[0, 0.03, 0]}>
              <sphereGeometry args={[0.10, 6, 4, 0, Math.PI * 2, 0, Math.PI * 0.5]} />
              <meshStandardMaterial color={capColor} roughness={0.85} />
            </mesh>
            {/* Cap visor */}
            <mesh position={[0, -0.01, 0.08]} rotation={[0.15, 0, 0]}>
              <boxGeometry args={[0.16, 0.008, 0.08]} />
              <meshStandardMaterial color={capColor} roughness={0.85} />
            </mesh>
            {/* Cap logo accent */}
            <mesh position={[0, 0.04, 0.065]}>
              <boxGeometry args={[0.04, 0.015, 0.005]} />
              <meshStandardMaterial color={capAccent} emissive={glowColor} emissiveIntensity={0.4} roughness={0.4} />
            </mesh>
          </group>

          {/* Hair peaking below cap */}
          <mesh position={[-0.08, -0.02, 0.02]}>
            <sphereGeometry args={[0.025, 4, 3]} />
            <meshStandardMaterial color={hairColor} roughness={0.9} />
          </mesh>
          <mesh position={[0.08, -0.02, 0.02]}>
            <sphereGeometry args={[0.025, 4, 3]} />
            <meshStandardMaterial color={hairColor} roughness={0.9} />
          </mesh>
        </group>

        <Arms sleeveColor={shirtColor} skinColor={skinColor} />
      </group>

      <Legs pantsColor={pantsColor} pantsDark={pantsDark} shoeColor="#1a1a1a" accentGlow={glowColor} accentColor={accentColor} />
    </group>
  );
}

/* ═══════════════════════════════════════════════════════════════════
    SELECTOR — picks the right procedural model based on NPC definition id
    ═══════════════════════════════════════════════════════════════════ */

const DEFAULT_APPEARANCE: NPCAppearance = {
  bodyColor: '#6a6a7a',
  accentColor: '#9a9aaa',
  headAccessory: 'none',
  height: 1.0,
  glowColor: '#ffffff',
  silhouette: 'average',
};

export interface ProceduralNPCModelProps {
  definitionId: string;
  appearance: NPCAppearance;
  animState?: 'idle' | 'walk' | 'talk';
  interactionState?: InteractionState;
  isInteractionTarget?: boolean;
  /** Schedule-driven activity for animation state selection */
  activity?: string;
}

/** Selects and renders the unique procedural model for a given NPC definition id */
export function ProceduralNPCModel({
  definitionId,
  appearance,
  interactionState = InteractionState.Idle,
  activity = 'idle',
}: ProceduralNPCModelProps) {
  const app = appearance ?? DEFAULT_APPEARANCE;

  // Derive animation state from interaction or schedule activity
  // Priority: dialogue → talk, schedule activity → mapped animation, else idle
  let animState: 'idle' | 'walk' | 'talk';
  if (interactionState === InteractionState.Dialogue) {
    animState = 'talk';
  } else {
    // Map schedule activities to animation states
    switch (activity) {
      case 'walk':
        animState = 'walk';
        break;
      case 'talk':
        animState = 'talk';
        break;
      case 'work':
      case 'read':
      case 'rest':
      case 'sleep':
      case 'idle':
      default:
        animState = 'idle';
        break;
    }
  }

  // Scale by height and silhouette
  const heightScale = app.height;
  const widthScale = app.silhouette === 'slim' ? 0.9 : app.silhouette === 'heavy' ? 1.15 : 1.0;

  switch (definitionId) {
    case 'albert':
      return (
        <group scale={[widthScale, heightScale, widthScale]}>
          <AlbertModel appearance={app} animState={animState} />
        </group>
      );
    case 'zarema':
      return (
        <group scale={[widthScale, heightScale, widthScale]}>
          <ZaremaModel appearance={app} animState={animState} />
        </group>
      );
    case 'maria':
      return (
        <group scale={[widthScale, heightScale, widthScale]}>
          <MariaModel appearance={app} animState={animState} />
        </group>
      );
    case 'office_dmitry':
      return (
        <group scale={[widthScale, heightScale, widthScale]}>
          <DmitryModel appearance={app} animState={animState} />
        </group>
      );
    case 'office_alexander':
      return (
        <group scale={[widthScale, heightScale, widthScale]}>
          <AlexanderModel appearance={app} animState={animState} />
        </group>
      );
    case 'office_colleague':
      return (
        <group scale={[widthScale, heightScale, widthScale]}>
          <ColleagueModel appearance={app} animState={animState} />
        </group>
      );
    case 'cafe_barista':
      return (
        <group scale={[widthScale, heightScale, widthScale]}>
          <BaristaModel appearance={app} animState={animState} />
        </group>
      );
    default:
      // Fallback generic model using Albert as base with custom colors
      return (
        <group scale={[widthScale, heightScale, widthScale]}>
          <AlbertModel appearance={app} animState={animState} />
        </group>
      );
  }
}
