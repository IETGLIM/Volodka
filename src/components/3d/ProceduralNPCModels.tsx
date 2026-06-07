
/* ─── Volodka RPG – Unique Procedural Humanoid NPC Models
     Each of the 12 NPCs has a distinct silhouette, clothing, accessories,
     and idle/walk/talk animations built entirely from Three.js primitives.
     Quality matches the ProceduralPlayerModel in PhysicsPlayer.tsx. ─── */

import { useRef, useEffect, useMemo } from 'react';
import { useFrameTick } from '@/engine/frame/useFrameTick';
import * as THREE from 'three';
import type { NPCAppearance } from '@/shared/types/game';
import { InteractionState } from '@/engine/interaction/interactionMachine';
import {
  sharedGeo,
  sharedMat,
  mergedGeo,
  npcMat,
  skinMat,
  skinShadowMat,
  clothingMat,
  hairMat,
  metalMat,
  glowScreenMat,
  stubbleMat,
  emissiveMat,
  buildMerged,
  boxGeo,
  sphereGeo,
  cylinderGeo,
  capsuleGeo,
  torusGeo,
  circleGeo,
  DEFAULT_ARM_WIDTH,
  DEFAULT_FOREARM_WIDTH,
  DEFAULT_LEG_WIDTH,
  DEFAULT_LOWER_LEG_WIDTH,
} from './proceduralNpcShared';

/* ─── Shared color constants ─── */
const SKIN_LIGHT = '#c4a882';
const SKIN_MEDIUM = '#b09070';
const SKIN_DARK = '#8a6a50';
const SKIN_SHADOW_LIGHT = '#b89a72';
const SKIN_SHADOW_MED = '#9a7a60';
const HAIR_DARK = '#2a1e12';
const HAIR_BROWN = '#4a3020';
const HAIR_GRAY = '#888890';
const HAIR_BLACK = '#0e0a08';

/* ─── Shared body parts ─── */

/** Reusable eye cluster (both eyes with pupils, iris, eyebrows) — shared geo/mat */
function Eyes({
  browAngle = 0.1,
  irisColor = '#4a3520',
}: {
  browAngle?: number;
  irisColor?: string;
}) {
  const irisMat = useMemo(
    () => npcMat({ color: irisColor, roughness: 0.4, metalness: 0.2 }),
    [irisColor],
  );
  return (
    <>
      <mesh position={[-0.038, 0.015, 0.092]} geometry={sharedGeo.eyeSphere} material={sharedMat.eyeWhite}>
        <mesh position={[0, 0, 0.014]} geometry={sharedGeo.pupilSphere} material={sharedMat.pupil} />
        <mesh position={[0, 0, 0.012]} geometry={sharedGeo.irisSphere} material={irisMat} />
      </mesh>
      <mesh position={[0.038, 0.015, 0.092]} geometry={sharedGeo.eyeSphere} material={sharedMat.eyeWhite}>
        <mesh position={[0, 0, 0.014]} geometry={sharedGeo.pupilSphere} material={sharedMat.pupil} />
        <mesh position={[0, 0, 0.012]} geometry={sharedGeo.irisSphere} material={irisMat} />
      </mesh>
      <mesh position={[-0.038, 0.035, 0.095]} rotation={[0, 0, browAngle]} geometry={sharedGeo.browBox} material={sharedMat.brow} />
      <mesh position={[0.038, 0.035, 0.095]} rotation={[0, 0, -browAngle]} geometry={sharedGeo.browBox} material={sharedMat.brow} />
    </>
  );
}

/** Nose, mouth, chin, ears — shared geo/mat, merged mouth draw call */
function FaceFeatures({
  skinColor = SKIN_LIGHT,
  shadowColor = SKIN_SHADOW_LIGHT,
  mouthCornersDown = true,
}: {
  skinColor?: string;
  shadowColor?: string;
  mouthCornersDown?: boolean;
}) {
  const skin = skinMat(skinColor);
  const shadow = skinShadowMat(shadowColor);
  const mouthGeo = mouthCornersDown ? mergedGeo.mouthWithCornersDown : mergedGeo.mouthLineOnly;
  return (
    <>
      <mesh position={[0, 0.008, 0.1]} geometry={sharedGeo.noseBridge} material={skin} />
      <mesh position={[0, -0.008, 0.105]} geometry={sharedGeo.noseTip} material={shadow} />
      <mesh geometry={mouthGeo} material={sharedMat.mouth} />
      <mesh position={[0, -0.085, 0.045]} geometry={sharedGeo.chinSphere} material={skin} />
      <mesh position={[-0.1, 0.0, 0.0]} rotation={[0, -0.2, 0]} geometry={sharedGeo.earSphere} material={shadow} />
      <mesh position={[0.1, 0.0, 0.0]} rotation={[0, 0.2, 0]} geometry={sharedGeo.earSphere} material={shadow} />
    </>
  );
}

/** Arms with clothing and hands — shared geo/mat, width via scale */
function Arms({
  sleeveColor,
  skinColor = SKIN_LIGHT,
  armWidth = DEFAULT_ARM_WIDTH,
  forearmWidth = DEFAULT_FOREARM_WIDTH,
  wristAccessory,
}: {
  sleeveColor: string;
  skinColor?: string;
  armWidth?: number;
  forearmWidth?: number;
  wristAccessory?: React.ReactNode;
}) {
  const sleeveMat = useMemo(() => clothingMat(sleeveColor), [sleeveColor]);
  const skin = skinMat(skinColor);
  const armScale: [number, number, number] = [armWidth / DEFAULT_ARM_WIDTH, 1, armWidth / DEFAULT_ARM_WIDTH];
  const forearmScale: [number, number, number] = [forearmWidth / DEFAULT_FOREARM_WIDTH, 1, forearmWidth / DEFAULT_FOREARM_WIDTH];

  const sleeveGeo = useMemo(
    () => buildMerged([
      { geo: sharedGeo.upperArmCapsule, position: [0, -0.14, 0], scale: armScale },
      { geo: sharedGeo.forearmCapsule, position: [0, -0.3, 0], scale: forearmScale },
    ]),
    [armWidth, forearmWidth],
  );
  const handGeo = useMemo(
    () => buildMerged([
      { geo: sharedGeo.wristCapsule, position: [0, -0.38, 0] },
      { geo: sharedGeo.handSphere, position: [0, -0.42, 0] },
      { geo: sharedGeo.fingerBox, position: [0, -0.45, 0.01] },
    ]),
    [],
  );

  const armSegment = (side: 'left' | 'right') => (
    <group
      name={side === 'left' ? 'leftArm' : 'rightArm'}
      position={[side === 'left' ? 0.24 : -0.24, 0.18, 0]}
      rotation={[0, 0, side === 'left' ? 0.12 : -0.12]}
    >
      <mesh castShadow geometry={sleeveGeo} material={sleeveMat} />
      <mesh castShadow geometry={handGeo} material={skin} />
      {side === 'left' && wristAccessory}
    </group>
  );

  return (
    <>
      {armSegment('left')}
      {armSegment('right')}
    </>
  );
}

/** Legs with shoes — shared geo/mat, width & shoe size via scale */
function Legs({
  pantsColor,
  pantsDark,
  shoeColor = '#1a1a1a',
  soleColor = '#e8e0d8',
  shoeScale = 1.0,
  legWidth = DEFAULT_LEG_WIDTH,
  lowerLegWidth = DEFAULT_LOWER_LEG_WIDTH,
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
  const pantsMat = useMemo(() => clothingMat(pantsColor), [pantsColor]);
  const pantsDarkMat = useMemo(() => npcMat({ color: pantsDark, roughness: 0.85 }), [pantsDark]);
  const shoeMat = useMemo(
    () => (shoeColor === '#1a1a1a' ? sharedMat.sneaker : npcMat({ color: shoeColor, roughness: 0.9, metalness: 0.05 })),
    [shoeColor],
  );
  const soleMat = useMemo(
    () => (soleColor === '#e8e0d8' ? sharedMat.sole : npcMat({ color: soleColor, roughness: 0.95 })),
    [soleColor],
  );
  const glowMat = useMemo(
    () => (accentGlow && accentColor
      ? npcMat({ color: accentColor, emissive: accentGlow, emissiveIntensity: 0.12, transparent: true, opacity: 0.3 })
      : null),
    [accentGlow, accentColor],
  );

  const legScale: [number, number, number] = [legWidth / DEFAULT_LEG_WIDTH, 1, legWidth / DEFAULT_LEG_WIDTH];
  const lowerLegScale: [number, number, number] = [lowerLegWidth / DEFAULT_LOWER_LEG_WIDTH, 1, lowerLegWidth / DEFAULT_LOWER_LEG_WIDTH];
  const shoeScaleVec: [number, number, number] = [shoeScale, shoeScale, shoeScale];

  const pantsGeo = useMemo(
    () => buildMerged([
      { geo: sharedGeo.upperLegCapsule, position: [0, -0.18, 0], scale: legScale },
      { geo: sharedGeo.lowerLegCapsule, position: [0, -0.4, 0], scale: lowerLegScale },
    ]),
    [legWidth, lowerLegWidth],
  );

  const legSegment = (side: 'left' | 'right') => (
    <group name={side === 'left' ? 'leftLeg' : 'rightLeg'} position={[side === 'left' ? 0.09 : -0.09, 0.9, 0]}>
      <mesh castShadow geometry={pantsGeo} material={pantsMat} />
      <mesh position={[0, -0.5, 0]} geometry={sharedGeo.jeansCuffCylinder} material={pantsDarkMat} />
      <mesh position={[0, -0.55, 0.02]} castShadow scale={shoeScaleVec} geometry={sharedGeo.sneakerBox} material={shoeMat} />
      <mesh position={[0, -0.58, 0.02]} scale={shoeScaleVec} geometry={sharedGeo.soleBox} material={soleMat} />
      {glowMat && (
        <mesh position={[0, -0.59, 0.02]} scale={shoeScaleVec} geometry={sharedGeo.sneakerGlowStrip} material={glowMat} />
      )}
    </group>
  );

  return (
    <>
      {legSegment('left')}
      {legSegment('right')}
    </>
  );
}

/** Skull + jaw + optional chin — shared geo/mat pattern (matches Albert) */
function NpcHead({
  skullGeo,
  jawGeo,
  jawPos = [0, -0.05, 0.025] as [number, number, number],
  chinGeo,
  chinPos,
  skinColor,
  hasStubble,
  stubbleGeo,
  stubbleColor,
  stubbleOpacity = 0.2,
  children,
}: {
  skullGeo: THREE.BufferGeometry;
  jawGeo: THREE.BufferGeometry;
  jawPos?: [number, number, number];
  chinGeo?: THREE.BufferGeometry;
  chinPos?: [number, number, number];
  skinColor: string;
  hasStubble?: boolean;
  stubbleGeo?: THREE.BufferGeometry;
  stubbleColor?: string;
  stubbleOpacity?: number;
  children?: React.ReactNode;
}) {
  const skin = skinMat(skinColor);
  return (
    <>
      <mesh castShadow geometry={skullGeo} material={skin} />
      <mesh position={jawPos} castShadow geometry={jawGeo} material={skin} />
      {chinGeo && chinPos && <mesh position={chinPos} geometry={chinGeo} material={skin} />}
      {children}
      {hasStubble && stubbleGeo && stubbleColor && (
        <mesh geometry={stubbleGeo} material={stubbleMat(stubbleColor, stubbleOpacity)} />
      )}
    </>
  );
}

/** Round scholarly glasses — merged lenses + temples */
function GlassesScholarly({ accentColor, glowColor }: { accentColor: string; glowColor: string }) {
  const lensMat = useMemo(
    () => emissiveMat(accentColor, glowColor, 0.3, 0.2, 0.8),
    [accentColor, glowColor],
  );
  const frameMat = useMemo(
    () => npcMat({ color: accentColor, roughness: 0.3, metalness: 0.9 }),
    [accentColor],
  );
  return (
    <group position={[0, 0.015, 0.1]}>
      <mesh geometry={mergedGeo.glassesLenses} material={lensMat} />
      <mesh position={[0, 0, 0]} geometry={sharedGeo.glassesBridge} material={frameMat} />
      <mesh geometry={mergedGeo.glassesTemples} material={frameMat} />
    </group>
  );
}

/** Round librarian glasses — merged lenses + temples */
function GlassesRound({ accentColor, glowColor }: { accentColor: string; glowColor: string }) {
  const lensMat = useMemo(
    () => emissiveMat(accentColor, glowColor, 0.3, 0.2, 0.8),
    [accentColor, glowColor],
  );
  const frameMat = useMemo(
    () => npcMat({ color: accentColor, roughness: 0.3, metalness: 0.9 }),
    [accentColor],
  );
  return (
    <group position={[0, 0.015, 0.1]}>
      <mesh geometry={mergedGeo.glassesLensesRound} material={lensMat} />
      <mesh position={[0, 0, 0]} geometry={sharedGeo.glassesBridgeRound} material={frameMat} />
      <mesh geometry={mergedGeo.glassesTemplesRound} material={frameMat} />
    </group>
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
  /* Cached body-part lookups (matches ProceduralPlayerModel bodyPartsRef) */
  const bodyPartsRef = useRef<{
    head: THREE.Group | null;
    torso: THREE.Group | null;
    leftArm: THREE.Group | null;
    rightArm: THREE.Group | null;
    leftLeg: THREE.Group | null;
    rightLeg: THREE.Group | null;
  } | null>(null);

  useEffect(() => {
    animStateRef.current = animState;
  }, [animState]);

  useFrameTick('npc', ({ delta }) => {
    if (!groupRef.current) return;
    const dt = Math.min(delta, 0.05);
    animTimeRef.current += dt;
    const t = animTimeRef.current;
    const body = groupRef.current;
    const currentAnimState = animStateRef.current;

    if (!bodyPartsRef.current) {
      bodyPartsRef.current = {
        head: body.getObjectByName('head') as THREE.Group | null,
        torso: body.getObjectByName('torso') as THREE.Group | null,
        leftArm: body.getObjectByName('leftArm') as THREE.Group | null,
        rightArm: body.getObjectByName('rightArm') as THREE.Group | null,
        leftLeg: body.getObjectByName('leftLeg') as THREE.Group | null,
        rightLeg: body.getObjectByName('rightLeg') as THREE.Group | null,
      };
    }

    const { head, torso, leftArm, rightArm, leftLeg, rightLeg } = bodyPartsRef.current;

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
        <mesh castShadow geometry={boxGeo(0.46, 0.50, 0.26)} material={clothingMat(tweedJacket, glowColor, 0.06)} />
        {/* Jacket lapels + pockets + elbow patches — merged tweedDark */}
        <mesh geometry={mergedGeo.lapelPair} material={npcMat({ color: tweedDark, roughness: 0.8 })} />
        <mesh geometry={mergedGeo.pocketLinePair} material={npcMat({ color: tweedDark, roughness: 0.8 })} />
        <mesh geometry={mergedGeo.elbowPatchPair} material={npcMat({ color: tweedDark, roughness: 0.8 })} />
        {/* Shirt visible between lapels */}
        <mesh position={[0, 0.08, 0.132]} geometry={boxGeo(0.08, 0.18, 0.008)} material={npcMat({ color: shirtColor, roughness: 0.7 })} />
        {/* Bow tie */}
        <mesh position={[0, 0.16, 0.138]} geometry={boxGeo(0.07, 0.035, 0.015)} material={npcMat({ color: bowTieColor, emissive: glowColor, emissiveIntensity: 0.2, roughness: 0.6 })} />
        {/* Bow tie center knot */}
        <mesh position={[0, 0.16, 0.142]} geometry={sharedGeo.bowTieKnot} material={npcMat({ color: bowTieColor, roughness: 0.6 })} />

        {/* Neck */}
        <mesh position={[0, 0.27, 0]} geometry={sharedGeo.neckCylinderLg} material={sharedMat.skinMedium} />

        {/* HEAD */}
        <group name="head" position={[0, 0.47, 0.02]}>
          <NpcHead
            skullGeo={sharedGeo.skullSphereLg}
            jawGeo={sharedGeo.jawTaperLg}
            jawPos={[0, -0.055, 0.025]}
            skinColor={SKIN_MEDIUM}
            hasStubble
            stubbleGeo={sharedGeo.stubblePlane}
            stubbleColor={SKIN_SHADOW_MED}
            stubbleOpacity={0.2}
          >
            <mesh position={[0, -0.075, 0.03]} rotation={[0.2, 0, 0]} geometry={sharedGeo.jawTaperMd} material={sharedMat.skinMedium} />
          </NpcHead>
          <Eyes browAngle={0.15} />
          <FaceFeatures skinColor={SKIN_MEDIUM} shadowColor={SKIN_SHADOW_MED} />
          <GlassesScholarly accentColor={accentColor} glowColor={glowColor} />
          {/* Hair — receding gray hair (merged) */}
          <mesh geometry={mergedGeo.hairGrayCluster} material={sharedMat.hairGray} />
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
        <mesh castShadow geometry={boxGeo(0.34, 0.46, 0.20)} material={npcMat({ color: dressColor, emissive: glowColor, emissiveIntensity: 0.08, roughness: 0.8, metalness: 0.05 })} />
        {/* Dress neckline — decorative border */}
        <mesh position={[0, 0.2, 0.105]} rotation={[0.3, 0, 0]} geometry={boxGeo(0.28, 0.015, 0.01)} material={npcMat({ color: dressAccent, emissive: glowColor, emissiveIntensity: 0.3, roughness: 0.5 })} />
        {/* Belt / sash at waist */}
        <mesh position={[0, -0.02, 0.105]} geometry={boxGeo(0.35, 0.03, 0.01)} material={npcMat({ color: dressAccent, emissive: glowColor, emissiveIntensity: 0.15, roughness: 0.6 })} />

        {/* Long skirt (overlapping legs) — A-line shape */}
        <mesh position={[0, -0.45, 0]} castShadow geometry={cylinderGeo(0.17, 0.26, 0.7, 8)} material={npcMat({ color: dressColor, emissive: glowColor, emissiveIntensity: 0.05, roughness: 0.85 })} />
        {/* Skirt decorative hem */}
        <mesh position={[0, -0.78, 0.15]} rotation={[0.5, 0, 0]} geometry={boxGeo(0.45, 0.015, 0.01)} material={npcMat({ color: dressAccent, emissive: glowColor, emissiveIntensity: 0.2, roughness: 0.5 })} />

        {/* Neck — slender */}
        <mesh position={[0, 0.26, 0]} geometry={sharedGeo.neckCylinderZarema} material={skinMat(skinColor)} />

        {/* HEAD */}
        <group name="head" position={[0, 0.46, 0.02]}>
          {/* Skull — slightly softer, more oval */}
          <mesh castShadow geometry={sharedGeo.skullSphereMd} material={skinMat(skinColor)} />
          {/* Jaw — softer */}
          <mesh position={[0, -0.05, 0.025]} castShadow geometry={sharedGeo.jawBoxMd} material={skinMat(skinColor)} />
          {/* Chin — delicate */}
          <mesh position={[0, -0.07, 0.04]} geometry={sharedGeo.chinSphereSm} material={skinMat(skinColor)} />
          <Eyes browAngle={0.05} irisColor="#3a5a40" />
          <FaceFeatures skinColor={skinColor} shadowColor={skinShadow} mouthCornersDown={false} />

          {/* Headscarf — wrapped around head, draped */}
          <group position={[0, 0.05, 0]}>
            {/* Main scarf wrap */}
            <mesh position={[0, 0.04, 0]} geometry={sphereGeo(0.11, 6, 5)} material={npcMat({ color: headscarfColor, emissive: headscarfAccent, emissiveIntensity: 0.1, roughness: 0.8 })} />
            {/* Scarf drape over ears — merged */}
            <mesh geometry={mergedGeo.scarfEarPair} material={npcMat({ color: headscarfColor, roughness: 0.8 })} />
            {/* Scarf tail hanging down back */}
            <mesh position={[0, -0.12, -0.08]} rotation={[-0.2, 0, 0]} geometry={boxGeo(0.12, 0.2, 0.02)} material={npcMat({ color: headscarfColor, emissive: headscarfAccent, emissiveIntensity: 0.05, roughness: 0.85 })} />
            {/* Decorative pattern on scarf */}
            <mesh position={[0, 0.08, 0.08]} geometry={boxGeo(0.08, 0.02, 0.01)} material={npcMat({ color: headscarfAccent, emissive: headscarfAccent, emissiveIntensity: 0.3, roughness: 0.5 })} />
          </group>

          {/* Earring — left side */}
          <group position={[0.09, -0.02, 0.04]}>
            <mesh geometry={sphereGeo(0.012, 6, 6)} material={npcMat({ color: accentColor, emissive: glowColor, emissiveIntensity: 0.5, roughness: 0.1, metalness: 0.95 })} />
            <mesh position={[0, -0.03, 0]} geometry={sphereGeo(0.015, 6, 6)} material={npcMat({ color: glowColor, emissive: glowColor, emissiveIntensity: 0.6, roughness: 0.1, metalness: 0.95 })} />
          </group>
        </group>

        {/* Arms — slim with dress sleeves */}
        <Arms sleeveColor={dressColor} skinColor={skinColor} armWidth={0.038} forearmWidth={0.034} />
      </group>

      {/* Legs hidden by long dress, just shoes visible */}
      <group name="leftLeg" position={[0.09, 0.9, 0]}>
        <mesh position={[0, -0.18, 0]} scale={[0.045 / DEFAULT_LEG_WIDTH, 1, 0.045 / DEFAULT_LEG_WIDTH]} geometry={sharedGeo.upperLegCapsule} material={clothingMat(dressColor)} />
        <mesh position={[0, -0.55, 0.02]} castShadow geometry={sharedGeo.sneakerBox} material={npcMat({ color: '#2a1a1a', roughness: 0.9 })} scale={[0.07 / 0.085, 0.05 / 0.055, 0.12 / 0.15]} />
      </group>
      <group name="rightLeg" position={[-0.09, 0.9, 0]}>
        <mesh position={[0, -0.18, 0]} scale={[0.045 / DEFAULT_LEG_WIDTH, 1, 0.045 / DEFAULT_LEG_WIDTH]} geometry={sharedGeo.upperLegCapsule} material={clothingMat(dressColor)} />
        <mesh position={[0, -0.55, 0.02]} castShadow geometry={sharedGeo.sneakerBox} material={npcMat({ color: '#2a1a1a', roughness: 0.9 })} scale={[0.07 / 0.085, 0.05 / 0.055, 0.12 / 0.15]} />
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
        <mesh castShadow geometry={boxGeo(0.38, 0.46, 0.22)} material={npcMat({ color: jacketColor, emissive: glowColor, emissiveIntensity: 0.06, roughness: 0.8 })} />
        {/* Jacket collar turned up */}
        <mesh position={[-0.08, 0.2, 0.06]} rotation={[0, 0, 0.3]} geometry={boxGeo(0.06, 0.08, 0.02)} material={npcMat({ color: jacketDark, roughness: 0.8 })} />
        <mesh position={[0.08, 0.2, 0.06]} rotation={[0, 0, -0.3]} geometry={boxGeo(0.06, 0.08, 0.02)} material={npcMat({ color: jacketDark, roughness: 0.8 })} />
        {/* T-shirt visible under jacket */}
        <mesh position={[0, 0.1, 0.115]} geometry={boxGeo(0.18, 0.12, 0.008)} material={npcMat({ color: topColor, roughness: 0.7 })} />
        {/* Jacket zipper line */}
        <mesh position={[0, 0.0, 0.112]} geometry={boxGeo(0.005, 0.46, 0.005)} material={sharedMat.metalGray} />
        {/* Jacket pockets */}
        <mesh position={[-0.1, -0.1, 0.115]} geometry={boxGeo(0.08, 0.06, 0.005)} material={npcMat({ color: jacketDark, roughness: 0.8 })} />
        <mesh position={[0.1, -0.1, 0.115]} geometry={boxGeo(0.08, 0.06, 0.005)} material={npcMat({ color: jacketDark, roughness: 0.8 })} />

        {/* Phone in right hand — glowing screen */}
        <mesh position={[-0.24, -0.28, 0.08]} rotation={[0.3, 0, 0]} geometry={boxGeo(0.03, 0.05, 0.005)} material={npcMat({ color: glowColor, emissive: glowColor, emissiveIntensity: 0.6, roughness: 0.2, transparent: true, opacity: 0.7 })} />

        {/* Neck */}
        <mesh position={[0, 0.26, 0]} geometry={sharedGeo.neckCylinderMd} material={skinMat(skinColor)} />

        {/* HEAD */}
        <group name="head" position={[0, 0.46, 0.02]}>
          <mesh castShadow geometry={sharedGeo.skullSphereMd} material={skinMat(skinColor)} />
          <mesh position={[0, -0.05, 0.025]} castShadow geometry={sharedGeo.jawBoxMd} material={skinMat(skinColor)} />
          <mesh position={[0, -0.065, 0.035]} geometry={sharedGeo.chinSphereMd} material={skinMat(skinColor)} />
          <Eyes browAngle={0.06} irisColor="#4a6a8a" />
          <FaceFeatures skinColor={skinColor} shadowColor={skinShadow} mouthCornersDown={false} />

          {/* Hair — brown, shoulder-length with ponytail */}
          <mesh position={[0, 0.08, -0.01]} geometry={sphereGeo(0.085, 5, 4)} material={hairMat(hairColor)} />
          {/* Front bangs */}
          <mesh position={[0, 0.07, 0.065]} geometry={sphereGeo(0.06, 5, 4)} material={hairMat(hairColor)} />
          {/* Side hair */}
          <mesh position={[-0.08, 0.03, 0.02]} geometry={sphereGeo(0.035, 4, 3)} material={hairMat(hairColor)} />
          <mesh position={[0.08, 0.03, 0.02]} geometry={sphereGeo(0.035, 4, 3)} material={hairMat(hairColor)} />
          {/* Back hair */}
          <mesh position={[0, 0.04, -0.07]} geometry={sphereGeo(0.07, 5, 4)} material={hairMat(hairColor)} />
          {/* Ponytail */}
          <mesh position={[0, 0.0, -0.14]} rotation={[0.3, 0, 0]} geometry={capsuleGeo(0.03, 0.18, 4, 6)} material={hairMat(hairColor)} />
          {/* Ponytail band */}
          <mesh position={[0, 0.02, -0.08]} geometry={torusGeo(0.035, 0.006, 4, 8)} material={npcMat({ color: accentColor, emissive: glowColor, emissiveIntensity: 0.3, roughness: 0.3, metalness: 0.6 })} />
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
        <mesh castShadow geometry={boxGeo(0.50, 0.52, 0.28)} material={npcMat({ color: workJacket, emissive: glowColor, emissiveIntensity: 0.06, roughness: 0.9, metalness: 0.05 })} />
        {/* Jacket front panels */}
        <mesh position={[-0.1, 0.0, 0.145]} rotation={[0, 0, 0.05]} geometry={boxGeo(0.12, 0.50, 0.01)} material={npcMat({ color: workJacketDark, roughness: 0.85 })} />
        <mesh position={[0.1, 0.0, 0.145]} rotation={[0, 0, -0.05]} geometry={boxGeo(0.12, 0.50, 0.01)} material={npcMat({ color: workJacketDark, roughness: 0.85 })} />
        {/* Undershirt at collar */}
        <mesh position={[0, 0.18, 0.145]} geometry={boxGeo(0.10, 0.10, 0.008)} material={npcMat({ color: undershirtColor, roughness: 0.7 })} />
        {/* Work jacket pockets — utility chest pockets */}
        <mesh position={[-0.12, 0.08, 0.145]} geometry={boxGeo(0.08, 0.06, 0.01)} material={npcMat({ color: workJacketDark, roughness: 0.85 })} />
        <mesh position={[0.12, 0.08, 0.145]} geometry={boxGeo(0.08, 0.06, 0.01)} material={npcMat({ color: workJacketDark, roughness: 0.85 })} />
        {/* Side pockets with flaps */}
        <mesh position={[-0.15, -0.1, 0.145]} geometry={boxGeo(0.08, 0.08, 0.01)} material={npcMat({ color: workJacketDark, roughness: 0.85 })} />
        <mesh position={[0.15, -0.1, 0.145]} geometry={boxGeo(0.08, 0.08, 0.01)} material={npcMat({ color: workJacketDark, roughness: 0.85 })} />
        {/* Tool clip on jacket */}
        <mesh position={[0.20, 0.0, 0.12]} geometry={boxGeo(0.01, 0.15, 0.02)} material={sharedMat.metalDark} />

        {/* Neck — thick */}
        <mesh position={[0, 0.26, 0]} geometry={sharedGeo.neckCylinderLg} material={skinMat(skinColor)} />

        {/* HEAD */}
        <group name="head" position={[0, 0.48, 0.02]}>
          {/* Skull — wider, heavier */}
          <mesh castShadow geometry={sharedGeo.skullSphereLg} material={skinMat(skinColor)} />
          <mesh position={[0, -0.06, 0.025]} castShadow geometry={sharedGeo.jawBoxLg} material={skinMat(skinColor)} />
          <mesh position={[0, -0.08, 0.035]} geometry={sharedGeo.chinSphereXL} material={skinMat(skinColor)} />
          <Eyes browAngle={0.12} irisColor="#4a3a20" />
          <FaceFeatures skinColor={skinColor} shadowColor={skinShadow} />
          {/* Stubble */}
          <mesh position={[0, -0.065, 0.07]} geometry={sharedGeo.stubblePlaneMd} material={stubbleMat(skinShadow, 0.25)} />

          {/* Beanie cap */}
          <group position={[0, 0.06, 0]}>
            <mesh position={[0, 0.04, 0]} geometry={sphereGeo(0.11, 6, 5, 0, Math.PI * 2, 0, Math.PI * 0.55)} material={npcMat({ color: accentColor, emissive: glowColor, emissiveIntensity: 0.1, roughness: 0.9 })} />
            {/* Beanie cuff */}
            <mesh position={[0, -0.02, 0]} rotation={[0, 0, 0]} geometry={cylinderGeo(0.11, 0.11, 0.04, 8)} material={npcMat({ color: workJacket, roughness: 0.9 })} />
          </group>

          {/* Short hair under beanie */}
          <mesh position={[0, 0.02, -0.06]} geometry={sphereGeo(0.08, 5, 4)} material={sharedMat.hairDark} />
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
        <mesh castShadow geometry={boxGeo(0.40, 0.48, 0.23)} material={npcMat({ color: suitColor, emissive: glowColor, emissiveIntensity: 0.04, roughness: 0.7, metalness: 0.1 })} />
        {/* Suit lapels */}
        <mesh position={[-0.06, 0.12, 0.12]} rotation={[0, 0, 0.2]} geometry={boxGeo(0.05, 0.16, 0.008)} material={npcMat({ color: suitDark, roughness: 0.7, metalness: 0.1 })} />
        <mesh position={[0.06, 0.12, 0.12]} rotation={[0, 0, -0.2]} geometry={boxGeo(0.05, 0.16, 0.008)} material={npcMat({ color: suitDark, roughness: 0.7, metalness: 0.1 })} />
        {/* Shirt */}
        <mesh position={[0, 0.08, 0.118]} geometry={boxGeo(0.10, 0.20, 0.005)} material={npcMat({ color: shirtColor, roughness: 0.6 })} />
        {/* Tie */}
        <mesh position={[0, 0.04, 0.122]} geometry={boxGeo(0.025, 0.22, 0.006)} material={npcMat({ color: tieColor, emissive: glowColor, emissiveIntensity: 0.2, roughness: 0.5 })} />
        {/* Tie knot */}
        <mesh position={[0, 0.15, 0.122]} geometry={boxGeo(0.03, 0.025, 0.008)} material={npcMat({ color: tieColor, roughness: 0.5 })} />
        {/* Suit buttons — merged */}
        <mesh geometry={mergedGeo.suitButtons} material={sharedMat.metalDark} />

        {/* Scarf wrapped around neck */}
        <mesh position={[0, 0.22, 0.02]} rotation={[Math.PI * 0.5, 0, 0]} geometry={torusGeo(0.08, 0.03, 6, 12)} material={npcMat({ color: scarfColor, emissive: glowColor, emissiveIntensity: 0.1, roughness: 0.8 })} />
        {/* Scarf tail */}
        <mesh position={[0.08, 0.08, 0.1]} rotation={[0, 0, -0.15]} geometry={boxGeo(0.04, 0.18, 0.015)} material={npcMat({ color: scarfColor, roughness: 0.85 })} />

        {/* Neck */}
        <mesh position={[0, 0.27, 0]} geometry={sharedGeo.neckCylinder} material={sharedMat.skinLight} />

        {/* HEAD */}
        <group name="head" position={[0, 0.47, 0.02]}>
          <mesh castShadow geometry={sphereGeo(0.105, 8, 8)} material={sharedMat.skinLight} />
          <mesh position={[0, -0.055, 0.025]} castShadow geometry={boxGeo(0.155, 0.055, 0.11)} material={sharedMat.skinLight} />
          <mesh position={[0, -0.075, 0.035]} geometry={sphereGeo(0.026, 4, 4)} material={sharedMat.skinLight} />
          <Eyes browAngle={0.08} irisColor="#3a3020" />
          <FaceFeatures skinColor={SKIN_LIGHT} shadowColor={SKIN_SHADOW_LIGHT} />
          {/* Neatly trimmed hair */}
          <mesh position={[0, 0.08, -0.01]} geometry={sphereGeo(0.085, 5, 4)} material={sharedMat.hairBrown} />
          <mesh position={[0, 0.04, -0.07]} geometry={sphereGeo(0.06, 5, 4)} material={sharedMat.hairBrown} />
          <mesh position={[-0.08, 0.03, 0.0]} geometry={sphereGeo(0.025, 4, 3)} material={sharedMat.hairBrown} />
          <mesh position={[0.08, 0.03, 0.0]} geometry={sphereGeo(0.025, 4, 3)} material={sharedMat.hairBrown} />

          {/* Fedora hat */}
          <group position={[0, 0.08, 0]}>
            {/* Crown */}
            <mesh position={[0, 0.06, 0]} geometry={cylinderGeo(0.09, 0.10, 0.10, 10)} material={npcMat({ color: hatColor, roughness: 0.75 })} />
            {/* Crown indent */}
            <mesh position={[0, 0.10, 0]} geometry={cylinderGeo(0.06, 0.08, 0.03, 8)} material={npcMat({ color: hatColor, roughness: 0.75 })} />
            {/* Brim */}
            <mesh position={[0, 0.0, 0]} geometry={cylinderGeo(0.17, 0.18, 0.015, 14)} material={npcMat({ color: hatColor, roughness: 0.75 })} />
            {/* Hat band */}
            <mesh position={[0, 0.025, 0.095]} geometry={boxGeo(0.19, 0.015, 0.015)} material={npcMat({ color: hatBandColor, emissive: glowColor, emissiveIntensity: 0.3, roughness: 0.4 })} />
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
  const skinColor = SKIN_LIGHT;
  const skinShadow = SKIN_SHADOW_LIGHT;
  const hairColor = HAIR_DARK;

  return (
    <group ref={groupRef}>
      <group name="torso" position={[0, 1.05, 0.03]} rotation={[0.07, 0, 0]}>
        {/* Hoodie — slim fit */}
        <mesh castShadow geometry={boxGeo(0.36, 0.46, 0.22)} material={npcMat({ color: hoodieColor, emissive: glowColor, emissiveIntensity: 0.06, roughness: 0.85 })} />
        {/* Hoodie pocket */}
        <mesh position={[0, -0.12, 0.115]} geometry={boxGeo(0.22, 0.08, 0.01)} material={npcMat({ color: hoodieDark, roughness: 0.9 })} />
        {/* Hoodie drawstrings — merged */}
        <mesh geometry={mergedGeo.drawstringPair} material={sharedMat.drawstring} />
        {/* Hood (down) */}
        <mesh position={[0, 0.22, -0.06]} rotation={[-0.3, 0, 0]} castShadow geometry={sphereGeo(0.12, 6, 4, 0, Math.PI * 2, 0, Math.PI * 0.6)} material={npcMat({ color: hoodieColor, roughness: 0.85, side: THREE.DoubleSide })} />
        {/* Hoodie zipper */}
        <mesh position={[0, 0.0, 0.112]} geometry={boxGeo(0.004, 0.46, 0.004)} material={metalMat("#888", 0.7, 0.3)} />

        {/* Backpack */}
        <group position={[0, 0.05, -0.14]}>
          {/* Main body */}
          <mesh castShadow geometry={boxGeo(0.24, 0.30, 0.10)} material={npcMat({ color: backpackColor, roughness: 0.8 })} />
          {/* Top flap */}
          <mesh position={[0, 0.14, 0.02]} geometry={boxGeo(0.24, 0.04, 0.12)} material={npcMat({ color: backpackColor, roughness: 0.8 })} />
          {/* Backpack straps (visible over shoulders) */}
          <mesh position={[-0.08, 0.1, 0.06]} rotation={[0.1, 0, 0.05]} geometry={boxGeo(0.03, 0.30, 0.02)} material={npcMat({ color: backpackColor, roughness: 0.8 })} />
          <mesh position={[0.08, 0.1, 0.06]} rotation={[0.1, 0, -0.05]} geometry={boxGeo(0.03, 0.30, 0.02)} material={npcMat({ color: backpackColor, roughness: 0.8 })} />
          {/* Accent stripe on backpack */}
          <mesh position={[0, 0.0, 0.052]} geometry={boxGeo(0.22, 0.02, 0.005)} material={npcMat({ color: backpackAccent, emissive: glowColor, emissiveIntensity: 0.3, roughness: 0.5 })} />
          {/* Buckle */}
          <mesh position={[0, 0.12, 0.055]} geometry={boxGeo(0.04, 0.02, 0.01)} material={sharedMat.metalGray} />
        </group>

        {/* Neck */}
        <mesh position={[0, 0.26, 0]} geometry={sharedGeo.neckCylinderMd} material={skinMat(skinColor)} />

        {/* HEAD */}
        <group name="head" position={[0, 0.46, 0.02]}>
          <mesh castShadow geometry={sharedGeo.skullSphereMd} material={skinMat(skinColor)} />
          <mesh position={[0, -0.05, 0.025]} castShadow geometry={sharedGeo.jawBoxMd} material={skinMat(skinColor)} />
          <mesh position={[0, -0.065, 0.035]} geometry={sharedGeo.chinSphereMd} material={skinMat(skinColor)} />
          <Eyes browAngle={0.08} irisColor="#3a4a3a" />
          <FaceFeatures skinColor={skinColor} shadowColor={skinShadow} />

          {/* Earbuds — white cords and buds */}
          <mesh position={[-0.09, 0.0, 0.02]} geometry={sharedGeo.pupilSphere} material={sharedMat.earbuds} scale={[1.33, 1.33, 1.33]} />
          <mesh position={[0.09, 0.0, 0.02]} geometry={sharedGeo.pupilSphere} material={sharedMat.earbuds} scale={[1.33, 1.33, 1.33]} />
          <mesh geometry={mergedGeo.earbudCords} material={sharedMat.cord} />

          {/* Messy hair — young guy style */}
          <mesh position={[0, 0.09, -0.01]} geometry={sphereGeo(0.08, 5, 4)} material={hairMat(hairColor)} />
          <mesh position={[0, 0.07, 0.06]} geometry={sphereGeo(0.06, 5, 4)} material={hairMat(hairColor)} />
          <mesh position={[-0.03, 0.09, 0.05]} geometry={sphereGeo(0.03, 4, 3)} material={hairMat(hairColor)} />
          <mesh position={[0.03, 0.10, 0.04]} geometry={sphereGeo(0.025, 4, 3)} material={hairMat(hairColor)} />
          <mesh position={[-0.02, 0.11, 0.0]} geometry={sphereGeo(0.022, 3, 3)} material={hairMat(hairColor)} />
          <mesh position={[0.04, 0.09, -0.02]} geometry={sphereGeo(0.02, 3, 3)} material={hairMat(hairColor)} />
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
        <mesh castShadow geometry={boxGeo(0.38, 0.46, 0.22)} material={npcMat({ color: shirtColor, emissive: glowColor, emissiveIntensity: 0.04, roughness: 0.8 })} />
        {/* T-shirt collar */}
        <mesh position={[0, 0.22, 0.04]} rotation={[0.3, 0, 0]} geometry={torusGeo(0.06, 0.012, 4, 8, Math.PI)} material={npcMat({ color: shirtColor, roughness: 0.8 })} />

        {/* Apron over shirt */}
        <mesh position={[0, -0.02, 0.12]} castShadow geometry={boxGeo(0.36, 0.40, 0.01)} material={npcMat({ color: apronColor, emissive: glowColor, emissiveIntensity: 0.1, roughness: 0.85 })} />
        {/* Apron bib top */}
        <mesh position={[0, 0.12, 0.12]} geometry={boxGeo(0.20, 0.12, 0.01)} material={npcMat({ color: apronColor, roughness: 0.85 })} />
        {/* Apron neck strap */}
        <mesh position={[-0.08, 0.2, 0.04]} rotation={[0, 0, 0.2]} geometry={boxGeo(0.01, 0.12, 0.005)} material={npcMat({ color: apronColor, roughness: 0.85 })} />
        <mesh position={[0.08, 0.2, 0.04]} rotation={[0, 0, -0.2]} geometry={boxGeo(0.01, 0.12, 0.005)} material={npcMat({ color: apronColor, roughness: 0.85 })} />
        {/* Apron waist tie */}
        <mesh position={[0, 0.02, 0.13]} geometry={boxGeo(0.38, 0.02, 0.008)} material={npcMat({ color: apronAccent, emissive: glowColor, emissiveIntensity: 0.15, roughness: 0.7 })} />
        {/* Apron waist tie bow — right side */}
        <mesh position={[0.20, 0.02, 0.13]} rotation={[0, 0, -0.3]} geometry={boxGeo(0.06, 0.03, 0.008)} material={npcMat({ color: apronAccent, roughness: 0.7 })} />
        {/* Apron pocket */}
        <mesh position={[0, -0.10, 0.128]} geometry={boxGeo(0.12, 0.08, 0.005)} material={npcMat({ color: apronAccent, roughness: 0.8 })} />

        {/* Name tag on apron */}
        <mesh position={[0.08, 0.08, 0.128]} geometry={boxGeo(0.04, 0.025, 0.003)} material={sharedMat.nameTag} />

        {/* Neck */}
        <mesh position={[0, 0.26, 0]} geometry={sharedGeo.neckCylinderMd} material={skinMat(skinColor)} />

        {/* HEAD */}
        <group name="head" position={[0, 0.46, 0.02]}>
          <mesh castShadow geometry={sharedGeo.skullSphereMd} material={skinMat(skinColor)} />
          <mesh position={[0, -0.05, 0.025]} castShadow geometry={sharedGeo.jawBoxMd} material={skinMat(skinColor)} />
          <mesh position={[0, -0.065, 0.035]} geometry={sharedGeo.chinSphereMd} material={skinMat(skinColor)} />
          <Eyes browAngle={0.05} irisColor="#4a3a20" />
          <FaceFeatures skinColor={skinColor} shadowColor={skinShadow} mouthCornersDown={false} />
          {/* Friendly slight upturn at mouth corners */}

          {/* Cap / visor beanie */}
          <group position={[0, 0.07, 0]}>
            {/* Cap dome */}
            <mesh position={[0, 0.03, 0]} geometry={sphereGeo(0.10, 6, 4, 0, Math.PI * 2, 0, Math.PI * 0.5)} material={npcMat({ color: capColor, roughness: 0.85 })} />
            {/* Cap visor */}
            <mesh position={[0, -0.01, 0.08]} rotation={[0.15, 0, 0]} geometry={boxGeo(0.16, 0.008, 0.08)} material={npcMat({ color: capColor, roughness: 0.85 })} />
            {/* Cap logo accent */}
            <mesh position={[0, 0.04, 0.065]} geometry={boxGeo(0.04, 0.015, 0.005)} material={npcMat({ color: capAccent, emissive: glowColor, emissiveIntensity: 0.4, roughness: 0.4 })} />
          </group>

          {/* Hair peaking below cap */}
          <mesh position={[-0.08, -0.02, 0.02]} geometry={sphereGeo(0.025, 4, 3)} material={hairMat(hairColor)} />
          <mesh position={[0.08, -0.02, 0.02]} geometry={sphereGeo(0.025, 4, 3)} material={hairMat(hairColor)} />
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

/* ═══════════════════════════════════════════════════════════════════
    8. VERA – Archive keeper, older woman, warm scholarly look, scarf, book
    ═══════════════════════════════════════════════════════════════════ */
function VeraModel({ appearance, animState = 'idle' }: { appearance: NPCAppearance; animState?: 'idle' | 'walk' | 'talk' }) {
  const groupRef = useRef<THREE.Group>(null);
  useNPCAnimation(groupRef, animState, 0.03); // Gentle forward lean (scholarly)

  const bodyColor = appearance.bodyColor; // '#e8e0a0'
  const accentColor = appearance.accentColor; // '#e8e0a0'
  const glowColor = appearance.glowColor; // '#e8e0a0'

  const coatColor = bodyColor;
  const coatDark = '#c8c080';
  const blouseColor = '#f0e8d0';
  const pantsColor = '#5a5040';
  const pantsDark = '#4a4030';
  const skinColor = SKIN_LIGHT;
  const skinShadow = SKIN_SHADOW_LIGHT;
  const scarfColor = '#c8a030';
  const scarfAccent = glowColor;

  return (
    <group ref={groupRef}>
      {/* TORSO — slim, shorter scholarly build */}
      <group name="torso" position={[0, 1.05, 0.01]} rotation={[0.03, 0, 0]}>
        {/* Long coat — warm yellow tones */}
        <mesh castShadow geometry={boxGeo(0.36, 0.48, 0.22)} material={npcMat({ color: coatColor, emissive: glowColor, emissiveIntensity: 0.06, roughness: 0.85, metalness: 0.05 })} />
        {/* Coat front panels — darker shade */}
        <mesh position={[-0.08, 0.0, 0.115]} rotation={[0, 0, 0.05]} geometry={boxGeo(0.10, 0.46, 0.01)} material={npcMat({ color: coatDark, roughness: 0.85 })} />
        <mesh position={[0.08, 0.0, 0.115]} rotation={[0, 0, -0.05]} geometry={boxGeo(0.10, 0.46, 0.01)} material={npcMat({ color: coatDark, roughness: 0.85 })} />
        {/* Blouse visible at collar */}
        <mesh position={[0, 0.16, 0.115]} geometry={boxGeo(0.12, 0.12, 0.008)} material={npcMat({ color: blouseColor, roughness: 0.7 })} />
        {/* Scarf at neck */}
        <mesh position={[0, 0.20, 0.12]} geometry={boxGeo(0.22, 0.05, 0.02)} material={npcMat({ color: scarfColor, emissive: scarfAccent, emissiveIntensity: 0.15, roughness: 0.7 })} />
        {/* Scarf tails + coat pockets — merged */}
        <mesh geometry={mergedGeo.scarfTailPair} material={npcMat({ color: scarfColor, roughness: 0.8 })} />
        <mesh geometry={mergedGeo.coatPocketPair} material={npcMat({ color: coatDark, roughness: 0.85 })} />

        {/* Book / holographic pad in left hand */}
        <group position={[0.24, -0.30, 0.06]} rotation={[0.2, 0, 0.1]}>
          <mesh geometry={boxGeo(0.08, 0.10, 0.02)} material={npcMat({ color: coatDark, roughness: 0.8 })} />
          {/* Holographic page glow */}
          <mesh position={[0, 0, 0.012]} geometry={sharedGeo.holoScreen} material={glowScreenMat(glowColor, 0.5, 0.6)} />
        </group>

        {/* Neck */}
        <mesh position={[0, 0.26, 0]} geometry={cylinderGeo(0.042, 0.048, 0.06, 6)} material={skinMat(skinColor)} />

        {/* HEAD */}
        <group name="head" position={[0, 0.46, 0.02]}>
          {/* Skull — slightly softer, more oval */}
          <mesh castShadow geometry={sharedGeo.skullSphereMd} material={skinMat(skinColor)} />
          <mesh position={[0, -0.05, 0.025]} castShadow geometry={sharedGeo.jawBoxMd} material={skinMat(skinColor)} />
          <mesh position={[0, -0.065, 0.035]} geometry={sharedGeo.chinSphereMd} material={skinMat(skinColor)} />
          <Eyes browAngle={0.08} irisColor="#6a5a30" />
          <FaceFeatures skinColor={skinColor} shadowColor={skinShadow} mouthCornersDown={false} />

          {/* Hair — gray, tied back */}
          <mesh position={[0, 0.08, -0.01]} geometry={sphereGeo(0.085, 5, 4)} material={sharedMat.hairGray} />
          <mesh position={[-0.075, 0.04, 0.0]} geometry={sphereGeo(0.03, 4, 3)} material={sharedMat.hairGray} />
          <mesh position={[0.075, 0.04, 0.0]} geometry={sphereGeo(0.03, 4, 3)} material={sharedMat.hairGray} />
          {/* Hair bun at back */}
          <mesh position={[0, 0.06, -0.10]} geometry={sphereGeo(0.05, 5, 4)} material={sharedMat.hairGray} />

          {/* Scarf wrap on head */}
          <mesh position={[0, 0.05, 0.04]} geometry={sphereGeo(0.105, 6, 4, 0, Math.PI * 2, 0, Math.PI * 0.4)} material={npcMat({ color: scarfColor, emissive: scarfAccent, emissiveIntensity: 0.08, roughness: 0.8 })} />
        </group>

        <Arms sleeveColor={coatColor} skinColor={skinColor} armWidth={0.040} forearmWidth={0.035} />
      </group>

      <Legs pantsColor={pantsColor} pantsDark={pantsDark} shoeColor="#3a2a1a" accentGlow={glowColor} accentColor={accentColor} legWidth={0.050} lowerLegWidth={0.044} />
    </group>
  );
}

/* ═══════════════════════════════════════════════════════════════════
    9. SERGEY – Sysadmin, stocky tech guy, slightly hunched, tool belt
    ═══════════════════════════════════════════════════════════════════ */
function SergeyModel({ appearance, animState = 'idle' }: { appearance: NPCAppearance; animState?: 'idle' | 'walk' | 'talk' }) {
  const groupRef = useRef<THREE.Group>(null);
  useNPCAnimation(groupRef, animState, 0.07); // Hunched tech posture

  const bodyColor = appearance.bodyColor; // '#40a0c0'
  const accentColor = appearance.accentColor; // '#40a0c0'
  const glowColor = appearance.glowColor; // '#40a0c0'

  const hoodieColor = bodyColor;
  const hoodieDark = '#2a8090';
  const shirtColor = '#3a3a4a';
  const pantsColor = '#2a2a3a';
  const pantsDark = '#1a1a2a';
  const skinColor = SKIN_MEDIUM;
  const skinShadow = SKIN_SHADOW_MED;
  const beltColor = '#4a4a4a';

  return (
    <group ref={groupRef}>
      <group name="torso" position={[0, 1.05, 0.03]} rotation={[0.07, 0, 0]}>
        {/* Hoodie — average build, slightly stocky */}
        <mesh castShadow geometry={boxGeo(0.42, 0.48, 0.24)} material={npcMat({ color: hoodieColor, emissive: glowColor, emissiveIntensity: 0.06, roughness: 0.85, metalness: 0.05 })} />
        {/* Hoodie hood hanging behind */}
        <mesh position={[0, 0.20, -0.10]} rotation={[0.2, 0, 0]} geometry={sphereGeo(0.09, 6, 5, 0, Math.PI * 2, Math.PI * 0.3, Math.PI * 0.5)} material={npcMat({ color: hoodieDark, roughness: 0.85 })} />
        {/* Dark shirt visible at neckline */}
        <mesh position={[0, 0.16, 0.125]} geometry={boxGeo(0.14, 0.08, 0.008)} material={npcMat({ color: shirtColor, roughness: 0.7 })} />
        {/* Hoodie front pocket (kangaroo pocket) */}
        <mesh position={[0, -0.08, 0.125]} geometry={boxGeo(0.28, 0.12, 0.005)} material={npcMat({ color: hoodieDark, roughness: 0.85 })} />
        {/* Hoodie zipper */}
        <mesh position={[0, 0.0, 0.122]} geometry={boxGeo(0.004, 0.46, 0.004)} material={sharedMat.metalGray} />

        {/* Tool belt around waist */}
        <mesh position={[0, -0.20, 0.13]} geometry={boxGeo(0.44, 0.04, 0.02)} material={npcMat({ color: beltColor, roughness: 0.6, metalness: 0.4 })} />
        {/* Belt buckle */}
        <mesh position={[0, -0.20, 0.145]} geometry={boxGeo(0.03, 0.035, 0.01)} material={npcMat({ color: accentColor, emissive: glowColor, emissiveIntensity: 0.2, roughness: 0.3, metalness: 0.8 })} />
        {/* Tool pouches on belt — merged */}
        <mesh geometry={mergedGeo.beltPouchPair} material={npcMat({ color: beltColor, roughness: 0.6, metalness: 0.4 })} />

        {/* Glowing tablet / tool in right hand */}
        <group position={[-0.24, -0.30, 0.08]} rotation={[0.3, 0, -0.1]}>
          <mesh geometry={boxGeo(0.06, 0.08, 0.008)} material={npcMat({ color: "#2a2a2a", roughness: 0.5, metalness: 0.6 })} />
          {/* Screen glow */}
          <mesh position={[0, 0, 0.006]} geometry={sharedGeo.tabletScreen} material={glowScreenMat(glowColor, 0.7, 0.8)} />
        </group>

        {/* Neck — average */}
        <mesh position={[0, 0.26, 0]} geometry={sharedGeo.neckCylinder} material={skinMat(skinColor)} />

        {/* HEAD */}
        <group name="head" position={[0, 0.47, 0.02]}>
          {/* Skull — slightly wider */}
          <mesh castShadow geometry={sharedGeo.skullSphere} material={skinMat(skinColor)} />
          {/* Jaw */}
          <mesh position={[0, -0.055, 0.025]} castShadow geometry={sharedGeo.jawBox} material={skinMat(skinColor)} />
          <Eyes browAngle={0.10} irisColor="#3a5a6a" />
          <FaceFeatures skinColor={skinColor} shadowColor={skinShadow} />
          {/* Stubble */}
          <mesh position={[0, -0.055, 0.065]} geometry={sharedGeo.stubblePlaneSm} material={stubbleMat(skinShadow, 0.2)} />

          {/* Short messy hair */}
          <mesh position={[0, 0.08, -0.01]} geometry={sphereGeo(0.08, 5, 4)} material={sharedMat.hairBrown} />
          <mesh position={[-0.06, 0.06, 0.03]} geometry={sphereGeo(0.03, 4, 3)} material={sharedMat.hairBrown} />
          <mesh position={[0.06, 0.06, 0.03]} geometry={sphereGeo(0.03, 4, 3)} material={sharedMat.hairBrown} />
          {/* Bedhead tuft */}
          <mesh position={[0, 0.12, 0.02]} rotation={[0.1, 0, 0.15]} geometry={boxGeo(0.04, 0.04, 0.03)} material={sharedMat.hairBrown} />
        </group>

        <Arms sleeveColor={hoodieColor} skinColor={skinColor} armWidth={0.050} forearmWidth={0.044} />
      </group>

      <Legs pantsColor={pantsColor} pantsDark={pantsDark} shoeColor="#2a2a2a" accentGlow={glowColor} accentColor={accentColor} legWidth={0.056} lowerLegWidth={0.048} shoeScale={1.05} />
    </group>
  );
}

/* ═══════════════════════════════════════════════════════════════════
    10. LENA – Hacker, mysterious hooded figure, face partially hidden
    ═══════════════════════════════════════════════════════════════════ */
function LenaModel({ appearance, animState = 'idle' }: { appearance: NPCAppearance; animState?: 'idle' | 'walk' | 'talk' }) {
  const groupRef = useRef<THREE.Group>(null);
  useNPCAnimation(groupRef, animState, 0.02); // Subtle, cautious lean

  const bodyColor = appearance.bodyColor; // '#d040d0'
  const accentColor = appearance.accentColor; // '#d040d0'
  const glowColor = appearance.glowColor; // '#d040d0'

  const hoodieColor = bodyColor;
  const hoodieDark = '#a030a0';
  const pantsColor = '#1a1a2a';
  const pantsDark = '#0e0e1a';
  const skinColor = '#c4a882';
  const skinShadow = SKIN_SHADOW_LIGHT;

  return (
    <group ref={groupRef}>
      {/* TORSO — slim, compact, mysterious */}
      <group name="torso" position={[0, 1.05, 0.01]} rotation={[0.02, 0, 0]}>
        {/* Dark hoodie with purple glow */}
        <mesh castShadow geometry={boxGeo(0.32, 0.44, 0.20)} material={npcMat({ color: hoodieColor, emissive: glowColor, emissiveIntensity: 0.08, roughness: 0.85, metalness: 0.05 })} />
        {/* Hoodie pocket */}
        <mesh position={[0, -0.08, 0.105]} geometry={boxGeo(0.20, 0.08, 0.005)} material={npcMat({ color: hoodieDark, roughness: 0.85 })} />
        {/* Cyberpunk accent lines — merged */}
        <mesh geometry={mergedGeo.cyberAccentPair} material={npcMat({ color: accentColor, emissive: glowColor, emissiveIntensity: 0.6, roughness: 0.2 })} />

        {/* Neck — mostly hidden by hoodie */}
        <mesh position={[0, 0.26, 0]} geometry={sharedGeo.neckCylinderSm} material={skinMat(skinColor)} />

        {/* HEAD */}
        <group name="head" position={[0, 0.44, 0.02]}>
          {/* Skull — partially hidden */}
          <mesh castShadow geometry={sharedGeo.skullSphereSm} material={skinMat(skinColor)} />
          {/* Jaw — slim */}
          <mesh position={[0, -0.045, 0.02]} castShadow geometry={sharedGeo.jawBoxSm} material={skinMat(skinColor)} />

          {/* Eyes with glowing visor effect */}
          <Eyes browAngle={0.04} irisColor="#d040d0" />

          {/* Glowing visor / cyber-eye overlay */}
          <mesh position={[0, 0.015, 0.095]} geometry={sharedGeo.visorGlow} material={glowScreenMat(accentColor, 0.8, 0.5)} />
          <FaceFeatures skinColor={skinColor} shadowColor={skinShadow} mouthCornersDown={true} />

          {/* HOOD — large, overshadows face */}
          <group position={[0, 0.04, -0.02]}>
            {/* Hood dome */}
            <mesh position={[0, 0.06, 0.0]} geometry={sphereGeo(0.12, 6, 5)} material={npcMat({ color: hoodieDark, emissive: glowColor, emissiveIntensity: 0.04, roughness: 0.85 })} />
            {/* Hood front rim */}
            <mesh position={[0, -0.02, 0.08]} geometry={boxGeo(0.22, 0.025, 0.02)} material={npcMat({ color: hoodieDark, roughness: 0.85 })} />
            {/* Hood side shadows — merged */}
            <mesh geometry={mergedGeo.hoodShadowPair} material={npcMat({ color: hoodieDark, roughness: 0.85 })} />
          </group>

          {/* Dark hair barely visible under hood */}
          <mesh position={[0, 0.06, -0.03]} geometry={sphereGeo(0.07, 5, 4)} material={sharedMat.hairBlack} />
        </group>

        <Arms sleeveColor={hoodieColor} skinColor={skinColor} armWidth={0.038} forearmWidth={0.033} />
      </group>

      <Legs pantsColor={pantsColor} pantsDark={pantsDark} shoeColor="#1a1a1a" accentGlow={glowColor} accentColor={accentColor} legWidth={0.048} lowerLegWidth={0.042} />
    </group>
  );
}

/* ═══════════════════════════════════════════════════════════════════
    11. OLEG – Guild guard, large imposing figure, armored shoulders
    ═══════════════════════════════════════════════════════════════════ */
function OlegModel({ appearance, animState = 'idle' }: { appearance: NPCAppearance; animState?: 'idle' | 'walk' | 'talk' }) {
  const groupRef = useRef<THREE.Group>(null);
  useNPCAnimation(groupRef, animState, 0.05); // Upright military posture

  const bodyColor = appearance.bodyColor; // '#a0a0a0'
  const accentColor = appearance.accentColor; // '#a0a0a0'
  const glowColor = appearance.glowColor; // '#a0a0a0'

  const armorColor = bodyColor;
  const armorDark = '#707070';
  const undersuitColor = '#2a2a30';
  const pantsColor = '#303038';
  const pantsDark = '#202028';
  const skinColor = SKIN_MEDIUM;
  const skinShadow = SKIN_SHADOW_MED;
  const bootColor = '#1a1a1a';

  return (
    <group ref={groupRef}>
      <group name="torso" position={[0, 1.05, 0.02]} rotation={[0.05, 0, 0]}>
        {/* Heavy armor torso — broad and imposing */}
        <mesh castShadow geometry={boxGeo(0.52, 0.52, 0.28)} material={npcMat({ color: armorColor, emissive: glowColor, emissiveIntensity: 0.05, roughness: 0.5, metalness: 0.3 })} />
        {/* Chest plate detail */}
        <mesh position={[0, 0.04, 0.145]} geometry={boxGeo(0.30, 0.22, 0.01)} material={npcMat({ color: armorDark, roughness: 0.5, metalness: 0.4 })} />
        {/* Center line on chest */}
        <mesh position={[0, 0.04, 0.15]} geometry={boxGeo(0.006, 0.30, 0.006)} material={npcMat({ color: accentColor, emissive: glowColor, emissiveIntensity: 0.3, roughness: 0.2, metalness: 0.8 })} />
        {/* Undersuit at collar */}
        <mesh position={[0, 0.20, 0.145]} geometry={boxGeo(0.12, 0.08, 0.008)} material={npcMat({ color: undersuitColor, roughness: 0.7 })} />

        {/* SHOULDER ARMOR PLATES — large, distinctive */}
        {/* Left shoulder plate */}
        <group position={[0.28, 0.18, 0]}>
          <mesh castShadow geometry={boxGeo(0.14, 0.08, 0.16)} material={npcMat({ color: armorColor, emissive: glowColor, emissiveIntensity: 0.08, roughness: 0.4, metalness: 0.5 })} />
          {/* Shoulder plate rim */}
          <mesh position={[0, 0.02, 0.085]} geometry={boxGeo(0.14, 0.04, 0.01)} material={npcMat({ color: accentColor, emissive: glowColor, emissiveIntensity: 0.2, roughness: 0.3, metalness: 0.7 })} />
          {/* Rivet details */}
          <mesh position={[-0.04, 0.02, 0.08]} geometry={sphereGeo(0.008, 4, 4)} material={npcMat({ color: "#888", roughness: 0.3, metalness: 0.9 })} />
          <mesh position={[0.04, 0.02, 0.08]} geometry={sphereGeo(0.008, 4, 4)} material={npcMat({ color: "#888", roughness: 0.3, metalness: 0.9 })} />
        </group>
        {/* Right shoulder plate */}
        <group position={[-0.28, 0.18, 0]}>
          <mesh castShadow geometry={boxGeo(0.14, 0.08, 0.16)} material={npcMat({ color: armorColor, emissive: glowColor, emissiveIntensity: 0.08, roughness: 0.4, metalness: 0.5 })} />
          <mesh position={[0, 0.02, 0.085]} geometry={boxGeo(0.14, 0.04, 0.01)} material={npcMat({ color: accentColor, emissive: glowColor, emissiveIntensity: 0.2, roughness: 0.3, metalness: 0.7 })} />
          <mesh position={[-0.04, 0.02, 0.08]} geometry={sphereGeo(0.008, 4, 4)} material={npcMat({ color: "#888", roughness: 0.3, metalness: 0.9 })} />
          <mesh position={[0.04, 0.02, 0.08]} geometry={sphereGeo(0.008, 4, 4)} material={npcMat({ color: "#888", roughness: 0.3, metalness: 0.9 })} />
        </group>

        {/* Belt with utility pouches */}
        <mesh position={[0, -0.22, 0.145]} geometry={boxGeo(0.50, 0.04, 0.02)} material={npcMat({ color: armorDark, roughness: 0.5, metalness: 0.4 })} />
        <mesh position={[-0.16, -0.24, 0.15]} geometry={boxGeo(0.05, 0.06, 0.03)} material={npcMat({ color: armorDark, roughness: 0.5, metalness: 0.4 })} />
        <mesh position={[0.16, -0.24, 0.15]} geometry={boxGeo(0.05, 0.06, 0.03)} material={npcMat({ color: armorDark, roughness: 0.5, metalness: 0.4 })} />

        {/* Neck — thick, military */}
        <mesh position={[0, 0.28, 0]} geometry={sharedGeo.neckCylinderLg} material={skinMat(skinColor)} />

        {/* HEAD */}
        <group name="head" position={[0, 0.48, 0.02]}>
          {/* Skull — blocky, strong */}
          <mesh castShadow geometry={sharedGeo.skullSphereLg} material={skinMat(skinColor)} />
          {/* Jaw — heavy, square */}
          <mesh position={[0, -0.06, 0.025]} castShadow geometry={sharedGeo.jawBoxXL} material={skinMat(skinColor)} />
          <Eyes browAngle={0.14} irisColor="#4a4a30" />
          <FaceFeatures skinColor={skinColor} shadowColor={skinShadow} />
          {/* Stubble */}
          <mesh position={[0, -0.06, 0.07]} geometry={sharedGeo.stubblePlaneLg} material={stubbleMat(skinShadow, 0.25)} />

          {/* Short military buzz cut */}
          <mesh position={[0, 0.08, -0.01]} geometry={sphereGeo(0.09, 5, 4)} material={sharedMat.hairDark} />

          {/* Military-style cap / beret */}
          <mesh position={[0, 0.10, 0.02]} rotation={[0.05, 0, 0.08]} geometry={cylinderGeo(0.10, 0.10, 0.025, 8)} material={npcMat({ color: armorDark, roughness: 0.8 })} />
          {/* Cap top */}
          <mesh position={[0, 0.12, 0.01]} rotation={[0.05, 0, 0.08]} geometry={sphereGeo(0.10, 6, 4, 0, Math.PI * 2, 0, Math.PI * 0.35)} material={npcMat({ color: armorDark, emissive: glowColor, emissiveIntensity: 0.04, roughness: 0.8 })} />
          {/* Cap badge */}
          <mesh position={[0, 0.10, 0.10]} geometry={sphereGeo(0.012, 4, 4)} material={npcMat({ color: accentColor, emissive: glowColor, emissiveIntensity: 0.4, roughness: 0.2, metalness: 0.9 })} />
        </group>

        <Arms sleeveColor={armorDark} skinColor={skinColor} armWidth={0.054} forearmWidth={0.048} />
      </group>

      <Legs pantsColor={pantsColor} pantsDark={pantsDark} shoeColor={bootColor} accentGlow={glowColor} accentColor={accentColor} legWidth={0.062} lowerLegWidth={0.054} shoeScale={1.15} />
    </group>
  );
}

/* ═══════════════════════════════════════════════════════════════════
    12. KATE – Librarian, bookish woman, round glasses, carrying a book
    ═══════════════════════════════════════════════════════════════════ */
function KateModel({ appearance, animState = 'idle' }: { appearance: NPCAppearance; animState?: 'idle' | 'walk' | 'talk' }) {
  const groupRef = useRef<THREE.Group>(null);
  useNPCAnimation(groupRef, animState, 0.03); // Slight lean (bookish)

  const bodyColor = appearance.bodyColor; // '#60c060'
  const accentColor = appearance.accentColor; // '#60c060'
  const glowColor = appearance.glowColor; // '#60c060'

  const cardiganColor = bodyColor;
  const cardiganDark = '#40a040';
  const blouseColor = '#e8e0d8';
  const pantsColor = '#3a3a40';
  const pantsDark = '#2a2a30';
  const skinColor = SKIN_LIGHT;
  const skinShadow = SKIN_SHADOW_LIGHT;
  const hairColor = '#5a3a20';

  return (
    <group ref={groupRef}>
      <group name="torso" position={[0, 1.05, 0.01]} rotation={[0.03, 0, 0]}>
        {/* Cardigan — slim, bookish */}
        <mesh castShadow geometry={boxGeo(0.34, 0.46, 0.20)} material={npcMat({ color: cardiganColor, emissive: glowColor, emissiveIntensity: 0.06, roughness: 0.85, metalness: 0.05 })} />
        {/* Cardigan front panels */}
        <mesh position={[-0.08, 0.0, 0.105]} rotation={[0, 0, 0.05]} geometry={boxGeo(0.08, 0.44, 0.008)} material={npcMat({ color: cardiganDark, roughness: 0.85 })} />
        <mesh position={[0.08, 0.0, 0.105]} rotation={[0, 0, -0.05]} geometry={boxGeo(0.08, 0.44, 0.008)} material={npcMat({ color: cardiganDark, roughness: 0.85 })} />
        {/* Blouse visible under cardigan */}
        <mesh position={[0, 0.08, 0.108]} geometry={boxGeo(0.10, 0.16, 0.006)} material={npcMat({ color: blouseColor, roughness: 0.7 })} />
        {/* Cardigan buttons — merged */}
        <mesh position={[-0.02, 0, 0.112]} geometry={mergedGeo.cardiganButtons} material={npcMat({ color: accentColor, roughness: 0.3, metalness: 0.7 })} />

        {/* Book in left hand */}
        <group position={[0.24, -0.28, 0.06]} rotation={[0.2, 0, 0.1]}>
          {/* Book cover */}
          <mesh geometry={boxGeo(0.07, 0.09, 0.025)} material={npcMat({ color: cardiganDark, roughness: 0.8 })} />
          {/* Book spine */}
          <mesh position={[-0.038, 0, 0]} geometry={boxGeo(0.006, 0.09, 0.028)} material={npcMat({ color: accentColor, emissive: glowColor, emissiveIntensity: 0.15, roughness: 0.6 })} />
          {/* Book pages */}
          <mesh position={[0.01, 0, 0.014]} geometry={boxGeo(0.05, 0.085, 0.002)} material={sharedMat.bookPages} />
        </group>

        {/* Neck — slender */}
        <mesh position={[0, 0.26, 0]} geometry={sharedGeo.neckCylinderSlim} material={skinMat(skinColor)} />

        {/* HEAD */}
        <group name="head" position={[0, 0.46, 0.02]}>
          {/* Skull — slightly softer, more oval */}
          <mesh castShadow geometry={sharedGeo.skullSphereMd} material={skinMat(skinColor)} />
          <mesh position={[0, -0.05, 0.025]} castShadow geometry={sharedGeo.jawBoxMd} material={skinMat(skinColor)} />
          <mesh position={[0, -0.065, 0.035]} geometry={sharedGeo.chinSphereMd} material={skinMat(skinColor)} />
          <Eyes browAngle={0.06} irisColor="#4a6a3a" />
          <FaceFeatures skinColor={skinColor} shadowColor={skinShadow} mouthCornersDown={false} />

          <GlassesRound accentColor={accentColor} glowColor={glowColor} />

          {/* Hair — brown, shoulder-length, tidy */}
          <mesh position={[0, 0.08, -0.01]} geometry={sharedGeo.hairSphere} material={hairMat(hairColor)} />
          <mesh position={[0, 0.07, 0.065]} geometry={sharedGeo.hairBangsSm} material={hairMat(hairColor)} />
          <mesh geometry={mergedGeo.hairDarkSidesBack} material={hairMat(hairColor)} />
          {/* Hair bun */}
          <mesh position={[0, 0.08, -0.10]} geometry={sphereGeo(0.04, 5, 4)} material={hairMat(hairColor)} />
          {/* Hair pin in bun */}
          <mesh position={[0, 0.08, -0.12]} rotation={[0.3, 0, 0]} geometry={cylinderGeo(0.003, 0.003, 0.06, 4)} material={npcMat({ color: accentColor, emissive: glowColor, emissiveIntensity: 0.3, roughness: 0.2, metalness: 0.8 })} />
        </group>

        <Arms sleeveColor={cardiganColor} skinColor={skinColor} armWidth={0.038} forearmWidth={0.034} />
      </group>

      <Legs pantsColor={pantsColor} pantsDark={pantsDark} shoeColor="#2a2a2a" accentGlow={glowColor} accentColor={accentColor} legWidth={0.050} lowerLegWidth={0.044} />
    </group>
  );
}

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
    case 'vera':
      return (
        <group scale={[widthScale, heightScale, widthScale]}>
          <VeraModel appearance={app} animState={animState} />
        </group>
      );
    case 'sergey':
      return (
        <group scale={[widthScale, heightScale, widthScale]}>
          <SergeyModel appearance={app} animState={animState} />
        </group>
      );
    case 'lena':
      return (
        <group scale={[widthScale, heightScale, widthScale]}>
          <LenaModel appearance={app} animState={animState} />
        </group>
      );
    case 'oleg':
      return (
        <group scale={[widthScale, heightScale, widthScale]}>
          <OlegModel appearance={app} animState={animState} />
        </group>
      );
    case 'kate':
      return (
        <group scale={[widthScale, heightScale, widthScale]}>
          <KateModel appearance={app} animState={animState} />
        </group>
      );
    case 'chk_ru':
    case 'chk_guest_devops':
      return (
        <group scale={[widthScale, heightScale, widthScale]}>
          <ColleagueModel appearance={app} animState={animState} />
        </group>
      );
    case 'chk_based':
      return (
        <group scale={[widthScale, heightScale, widthScale]}>
          <SergeyModel appearance={app} animState={animState} />
        </group>
      );
    case 'chk_smert':
    case 'chk_guest_analyst':
      return (
        <group scale={[widthScale, heightScale, widthScale]}>
          <VeraModel appearance={app} animState={animState} />
        </group>
      );
    case 'chk_stalker':
      return (
        <group scale={[widthScale, heightScale, widthScale]}>
          <LenaModel appearance={app} animState={animState} />
        </group>
      );
    case 'chk_elis':
      return (
        <group scale={[widthScale, heightScale, widthScale]}>
          <KateModel appearance={app} animState={animState} />
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
