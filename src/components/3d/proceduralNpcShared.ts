/* ─── Shared geometries & materials for procedural NPC models
     Module-level singletons — one GPU buffer / shader per unique asset,
     reused across all NPC instances (matches ProceduralPlayerModel pattern). ─── */

import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';

/* ─── Shared geometry instances ─── */
export const sharedGeo = {
  eyeSphere: new THREE.SphereGeometry(0.018, 6, 6),
  pupilSphere: new THREE.SphereGeometry(0.009, 4, 4),
  irisSphere: new THREE.SphereGeometry(0.012, 5, 5),
  browBox: new THREE.BoxGeometry(0.032, 0.006, 0.008),
  noseBridge: new THREE.BoxGeometry(0.012, 0.025, 0.01),
  noseTip: new THREE.SphereGeometry(0.014, 4, 4),
  mouthLine: new THREE.BoxGeometry(0.045, 0.004, 0.008),
  mouthCorner: new THREE.BoxGeometry(0.01, 0.004, 0.005),
  chinSphere: new THREE.SphereGeometry(0.028, 5, 4),
  earSphere: new THREE.SphereGeometry(0.02, 4, 4),
  skullSphere: new THREE.SphereGeometry(0.105, 8, 8),
  skullSphereSm: new THREE.SphereGeometry(0.10, 8, 8),
  skullSphereLg: new THREE.SphereGeometry(0.11, 8, 8),
  jawBox: new THREE.BoxGeometry(0.155, 0.055, 0.11),
  jawBoxSm: new THREE.BoxGeometry(0.14, 0.05, 0.10),
  jawBoxLg: new THREE.BoxGeometry(0.17, 0.06, 0.12),
  upperArmCapsule: new THREE.CapsuleGeometry(0.048, 0.18, 4, 6),
  forearmCapsule: new THREE.CapsuleGeometry(0.042, 0.14, 4, 6),
  wristCapsule: new THREE.CapsuleGeometry(0.032, 0.03, 3, 5),
  handSphere: new THREE.SphereGeometry(0.028, 5, 4),
  fingerBox: new THREE.BoxGeometry(0.035, 0.02, 0.03),
  upperLegCapsule: new THREE.CapsuleGeometry(0.058, 0.24, 4, 6),
  lowerLegCapsule: new THREE.CapsuleGeometry(0.05, 0.2, 4, 6),
  jeansCuffCylinder: new THREE.CylinderGeometry(0.055, 0.052, 0.03, 6),
  sneakerBox: new THREE.BoxGeometry(0.085, 0.055, 0.15),
  soleBox: new THREE.BoxGeometry(0.09, 0.02, 0.16),
  sneakerGlowStrip: new THREE.BoxGeometry(0.09, 0.005, 0.16),
  neckCylinder: new THREE.CylinderGeometry(0.048, 0.055, 0.07, 6),
  neckCylinderSm: new THREE.CylinderGeometry(0.04, 0.048, 0.06, 6),
  neckCylinderLg: new THREE.CylinderGeometry(0.06, 0.065, 0.07, 6),
  hairSphere: new THREE.SphereGeometry(0.085, 5, 4),
  hairSide: new THREE.SphereGeometry(0.03, 4, 3),
  hairBack: new THREE.SphereGeometry(0.07, 5, 4),
  stubblePlane: new THREE.BoxGeometry(0.14, 0.05, 0.005),
  metalButton: new THREE.SphereGeometry(0.006, 4, 4),
  metalRivet: new THREE.SphereGeometry(0.008, 4, 4),
};

/* ─── Static materials (fixed palette) ─── */
export const sharedMat = {
  eyeWhite: new THREE.MeshStandardMaterial({ color: '#f0eeea', roughness: 0.3, metalness: 0.1 }),
  pupil: new THREE.MeshStandardMaterial({ color: '#1e100a', roughness: 0.2, metalness: 0.3 }),
  brow: new THREE.MeshStandardMaterial({ color: '#2a1e12', roughness: 0.8 }),
  mouth: new THREE.MeshStandardMaterial({ color: '#8a6a52', roughness: 0.8 }),
  skinLight: new THREE.MeshStandardMaterial({ color: '#c4a882', roughness: 0.7, metalness: 0.05 }),
  skinMedium: new THREE.MeshStandardMaterial({ color: '#b09070', roughness: 0.7, metalness: 0.05 }),
  skinDark: new THREE.MeshStandardMaterial({ color: '#8a6a50', roughness: 0.7, metalness: 0.05 }),
  skinShadowLight: new THREE.MeshStandardMaterial({ color: '#b89a72', roughness: 0.7 }),
  skinShadowMed: new THREE.MeshStandardMaterial({ color: '#9a7a60', roughness: 0.7 }),
  hairDark: new THREE.MeshStandardMaterial({ color: '#2a1e12', roughness: 0.9 }),
  hairBrown: new THREE.MeshStandardMaterial({ color: '#4a3020', roughness: 0.9 }),
  hairGray: new THREE.MeshStandardMaterial({ color: '#888890', roughness: 0.9 }),
  hairBlack: new THREE.MeshStandardMaterial({ color: '#0e0a08', roughness: 0.9 }),
  sneaker: new THREE.MeshStandardMaterial({ color: '#1a1a1a', roughness: 0.9, metalness: 0.05 }),
  sole: new THREE.MeshStandardMaterial({ color: '#e8e0d8', roughness: 0.95 }),
  metalGray: new THREE.MeshStandardMaterial({ color: '#888', roughness: 0.3, metalness: 0.8 }),
  metalDark: new THREE.MeshStandardMaterial({ color: '#555', roughness: 0.3, metalness: 0.8 }),
  earbuds: new THREE.MeshStandardMaterial({ color: '#e8e8e8', roughness: 0.3, metalness: 0.2 }),
  cord: new THREE.MeshStandardMaterial({ color: '#e8e8e8', roughness: 0.5 }),
  drawstring: new THREE.MeshStandardMaterial({ color: '#ccc', roughness: 0.6 }),
};

/* ─── Merged geometries (same material → fewer draw calls) ─── */
function mergeWithTransform(
  geo: THREE.BufferGeometry,
  position: [number, number, number],
  rotation?: [number, number, number],
): THREE.BufferGeometry {
  const clone = geo.clone();
  clone.applyMatrix4(
    new THREE.Matrix4().compose(
      new THREE.Vector3(...position),
      new THREE.Quaternion().setFromEuler(new THREE.Euler(...(rotation ?? [0, 0, 0]))),
      new THREE.Vector3(1, 1, 1),
    ),
  );
  return clone;
}

/** Mouth line + both corners → single draw call */
export const mergedGeo = {
  mouthWithCornersDown: mergeGeometries([
    mergeWithTransform(sharedGeo.mouthLine, [0, -0.035, 0.095]),
    mergeWithTransform(sharedGeo.mouthCorner, [-0.025, -0.032, 0.094], [0, 0, -0.3]),
    mergeWithTransform(sharedGeo.mouthCorner, [0.025, -0.032, 0.094], [0, 0, 0.3]),
  ])!,
  mouthLineOnly: mergeGeometries([
    mergeWithTransform(sharedGeo.mouthLine, [0, -0.035, 0.095]),
  ])!,
};

/* ─── Material cache keyed by appearance properties ─── */
export type NpcMatOpts = {
  color: string;
  roughness?: number;
  metalness?: number;
  emissive?: string;
  emissiveIntensity?: number;
  transparent?: boolean;
  opacity?: number;
  side?: THREE.Side;
};

const matCache = new Map<string, THREE.MeshStandardMaterial>();

export function npcMat(opts: NpcMatOpts): THREE.MeshStandardMaterial {
  const key = [
    opts.color,
    opts.roughness ?? 0.7,
    opts.metalness ?? 0.05,
    opts.emissive ?? '',
    opts.emissiveIntensity ?? 0,
    opts.transparent ? 1 : 0,
    opts.opacity ?? 1,
    opts.side ?? THREE.FrontSide,
  ].join('|');

  let mat = matCache.get(key);
  if (!mat) {
    mat = new THREE.MeshStandardMaterial({
      color: opts.color,
      roughness: opts.roughness ?? 0.7,
      metalness: opts.metalness ?? 0.05,
      ...(opts.emissive
        ? { emissive: new THREE.Color(opts.emissive), emissiveIntensity: opts.emissiveIntensity ?? 0 }
        : {}),
      ...(opts.transparent ? { transparent: true, opacity: opts.opacity ?? 1 } : {}),
      ...(opts.side !== undefined ? { side: opts.side } : {}),
    });
    matCache.set(key, mat);
  }
  return mat;
}

/** Resolve a skin-tone string to a cached shared material */
export function skinMat(color: string): THREE.MeshStandardMaterial {
  switch (color) {
    case '#c4a882':
      return sharedMat.skinLight;
    case '#b09070':
    case '#c0a080':
    case '#c9a67a':
    case '#d0b090':
      return sharedMat.skinMedium;
    case '#8a6a50':
      return sharedMat.skinDark;
    default:
      return npcMat({ color, roughness: 0.7, metalness: 0.05 });
  }
}

export function skinShadowMat(color: string): THREE.MeshStandardMaterial {
  switch (color) {
    case '#b89a72':
    case '#b89468':
    case '#c0a080':
      return sharedMat.skinShadowLight;
    case '#9a7a60':
    case '#b09070':
      return sharedMat.skinShadowMed;
    default:
      return npcMat({ color, roughness: 0.7 });
  }
}

/** Clothing material with optional emissive glow — cached per color combo */
export function clothingMat(
  color: string,
  glowColor?: string,
  emissiveIntensity = 0.06,
  roughness = 0.85,
): THREE.MeshStandardMaterial {
  if (glowColor) {
    return npcMat({ color, emissive: glowColor, emissiveIntensity, roughness, metalness: 0.05 });
  }
  return npcMat({ color, roughness, metalness: 0.05 });
}

/** Default arm/leg width ratios relative to shared capsule radii */
export const DEFAULT_ARM_WIDTH = 0.048;
export const DEFAULT_FOREARM_WIDTH = 0.042;
export const DEFAULT_LEG_WIDTH = 0.058;
export const DEFAULT_LOWER_LEG_WIDTH = 0.05;
