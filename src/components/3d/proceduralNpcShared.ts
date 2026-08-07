/* ─── Shared geometries & materials for procedural NPC models
     Module-level singletons — one GPU buffer / shader per unique asset,
     reused across all NPC instances (matches ProceduralPlayerModel pattern). ─── */

import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';

/* ─── Geometry cache — one GPU buffer per unique size ─── */
const geoCache = new Map<string, THREE.BufferGeometry>();

function geoKey(type: string, args: number[]): string {
  return `${type}|${args.join('|')}`;
}

export function boxGeo(w: number, h: number, d: number): THREE.BufferGeometry {
  const key = geoKey('box', [w, h, d]);
  let g = geoCache.get(key);
  if (!g) { g = new THREE.BoxGeometry(w, h, d); geoCache.set(key, g); }
  return g;
}

export function sphereGeo(r: number, ws = 8, hs = 8, phiStart = 0, phiLen = Math.PI * 2, thetaStart = 0, thetaLen = Math.PI): THREE.BufferGeometry {
  const key = geoKey('sphere', [r, ws, hs, phiStart, phiLen, thetaStart, thetaLen]);
  let g = geoCache.get(key);
  if (!g) { g = new THREE.SphereGeometry(r, ws, hs, phiStart, phiLen, thetaStart, thetaLen); geoCache.set(key, g); }
  return g;
}

export function cylinderGeo(rt: number, rb: number, h: number, seg = 8): THREE.BufferGeometry {
  const key = geoKey('cylinder', [rt, rb, h, seg]);
  let g = geoCache.get(key);
  if (!g) { g = new THREE.CylinderGeometry(rt, rb, h, seg); geoCache.set(key, g); }
  return g;
}

export function capsuleGeo(r: number, len: number, capSeg = 4, radSeg = 6): THREE.BufferGeometry {
  const key = geoKey('capsule', [r, len, capSeg, radSeg]);
  let g = geoCache.get(key);
  if (!g) { g = new THREE.CapsuleGeometry(r, len, capSeg, radSeg); geoCache.set(key, g); }
  return g;
}

export function torusGeo(r: number, tube: number, rs = 6, ts = 12, arc = Math.PI * 2): THREE.BufferGeometry {
  const key = geoKey('torus', [r, tube, rs, ts, arc]);
  let g = geoCache.get(key);
  if (!g) { g = new THREE.TorusGeometry(r, tube, rs, ts, arc); geoCache.set(key, g); }
  return g;
}

export function circleGeo(r: number, seg = 8): THREE.BufferGeometry {
  const key = geoKey('circle', [r, seg]);
  let g = geoCache.get(key);
  if (!g) { g = new THREE.CircleGeometry(r, seg); geoCache.set(key, g); }
  return g;
}

/* ─── Shared geometry instances (canonical sizes) ─── */
export const sharedGeo = {
  eyeSphere: sphereGeo(0.018, 6, 6),
  pupilSphere: sphereGeo(0.009, 4, 4),
  irisSphere: sphereGeo(0.012, 5, 5),
  browBox: boxGeo(0.032, 0.006, 0.008),
  noseBridge: boxGeo(0.012, 0.025, 0.01),
  noseTip: sphereGeo(0.014, 4, 4),
  mouthLine: boxGeo(0.045, 0.004, 0.008),
  mouthCorner: boxGeo(0.01, 0.004, 0.005),
  chinSphere: sphereGeo(0.028, 5, 4),
  chinSphereSm: sphereGeo(0.022, 4, 4),
  chinSphereMd: sphereGeo(0.024, 4, 4),
  chinSphereLg: sphereGeo(0.026, 4, 4),
  chinSphereXL: sphereGeo(0.03, 4, 4),
  earSphere: sphereGeo(0.02, 4, 4),
  skullSphere: sphereGeo(0.105, 8, 8),
  skullSphereSm: sphereGeo(0.095, 8, 8),
  skullSphereMd: sphereGeo(0.10, 8, 8),
  skullSphereLg: sphereGeo(0.11, 8, 8),
  jawBox: boxGeo(0.155, 0.055, 0.11),
  jawBoxSm: boxGeo(0.12, 0.04, 0.08),
  jawBoxMd: boxGeo(0.14, 0.05, 0.10),
  jawBoxLg: boxGeo(0.17, 0.06, 0.12),
  jawBoxXL: boxGeo(0.18, 0.06, 0.12),
  jawTaperMd: boxGeo(0.12, 0.03, 0.09),
  jawTaperLg: boxGeo(0.16, 0.06, 0.11),
  upperArmCapsule: capsuleGeo(0.048, 0.18, 4, 6),
  forearmCapsule: capsuleGeo(0.042, 0.14, 4, 6),
  wristCapsule: capsuleGeo(0.032, 0.03, 3, 5),
  handSphere: sphereGeo(0.028, 5, 4),
  fingerBox: boxGeo(0.035, 0.02, 0.03),
  upperLegCapsule: capsuleGeo(0.058, 0.24, 4, 6),
  lowerLegCapsule: capsuleGeo(0.05, 0.2, 4, 6),
  jeansCuffCylinder: cylinderGeo(0.055, 0.052, 0.03, 6),
  sneakerBox: boxGeo(0.085, 0.055, 0.15),
  soleBox: boxGeo(0.09, 0.02, 0.16),
  sneakerGlowStrip: boxGeo(0.09, 0.005, 0.16),
  neckCylinder: cylinderGeo(0.048, 0.055, 0.07, 6),
  neckCylinderSm: cylinderGeo(0.035, 0.040, 0.04, 6),
  neckCylinderMd: cylinderGeo(0.042, 0.05, 0.06, 6),
  neckCylinderLg: cylinderGeo(0.06, 0.065, 0.07, 6),
  neckCylinderSlim: cylinderGeo(0.038, 0.045, 0.06, 6),
  neckCylinderZarema: cylinderGeo(0.04, 0.048, 0.06, 6),
  hairSphere: sphereGeo(0.085, 5, 4),
  hairSide: sphereGeo(0.03, 4, 3),
  hairBack: sphereGeo(0.07, 5, 4),
  hairBangs: sphereGeo(0.06, 5, 4),
  hairBangsSm: sphereGeo(0.055, 5, 4),
  hairTuft: sphereGeo(0.035, 4, 3),
  hairTuftSm: sphereGeo(0.025, 4, 3),
  hairTuftMd: sphereGeo(0.03, 4, 3),
  hairBun: sphereGeo(0.05, 5, 4),
  hairBunSm: sphereGeo(0.04, 5, 4),
  hairPonytail: capsuleGeo(0.03, 0.18, 4, 6),
  hairUnderBeanie: sphereGeo(0.08, 5, 4),
  stubblePlane: boxGeo(0.14, 0.05, 0.005),
  stubblePlaneMd: boxGeo(0.15, 0.05, 0.005),
  stubblePlaneLg: boxGeo(0.16, 0.05, 0.005),
  stubblePlaneSm: boxGeo(0.13, 0.04, 0.005),
  metalButton: sphereGeo(0.006, 4, 4),
  metalButtonSm: sphereGeo(0.005, 4, 4),
  metalRivet: sphereGeo(0.008, 4, 4),
  bowTieKnot: sphereGeo(0.012, 4, 4),
  glassesLens: torusGeo(0.025, 0.003, 6, 12),
  glassesLensRound: torusGeo(0.022, 0.003, 6, 16),
  glassesBridge: boxGeo(0.02, 0.004, 0.003),
  glassesBridgeRound: boxGeo(0.016, 0.003, 0.003),
  glassesTemple: boxGeo(0.06, 0.004, 0.003),
  glassesTempleRound: boxGeo(0.05, 0.003, 0.003),
  lapelBox: boxGeo(0.05, 0.16, 0.01),
  pocketLine: boxGeo(0.06, 0.005, 0.008),
  elbowPatch: circleGeo(0.04, 8),
  zipperLine: boxGeo(0.005, 0.46, 0.005),
  zipperLineSm: boxGeo(0.004, 0.46, 0.004),
  drawstringLong: boxGeo(0.003, 0.12, 0.003),
  drawstringShort: boxGeo(0.003, 0.10, 0.003),
  earringTop: sphereGeo(0.012, 6, 6),
  earringBottom: sphereGeo(0.015, 6, 6),
  ponytailBand: torusGeo(0.035, 0.006, 4, 8),
  visorGlow: boxGeo(0.10, 0.015, 0.003),
  phoneScreen: boxGeo(0.03, 0.05, 0.005),
  tabletBody: boxGeo(0.06, 0.08, 0.008),
  tabletScreen: boxGeo(0.048, 0.06, 0.002),
  bookCover: boxGeo(0.07, 0.09, 0.025),
  bookSpine: boxGeo(0.006, 0.09, 0.028),
  bookPages: boxGeo(0.05, 0.085, 0.002),
  holoPad: boxGeo(0.08, 0.10, 0.02),
  holoScreen: boxGeo(0.06, 0.08, 0.002),
};

/* ─── Static materials (fixed palette) ─── */
export const sharedMat = {
  eyeWhite: new THREE.MeshStandardMaterial({ color: '#f0eeea', roughness: 0.3, metalness: 0.1 }),
  pupil: new THREE.MeshStandardMaterial({ color: '#1e100a', roughness: 0.2, metalness: 0.3 }),
  brow: new THREE.MeshStandardMaterial({ color: '#2a1e12', roughness: 0.8 }),
  mouth: new THREE.MeshPhysicalMaterial({ color: '#8a6a52', roughness: 0.8, sheen: 0.15, sheenRoughness: 0.4 }),
  skinLight: new THREE.MeshPhysicalMaterial({ color: '#c4a882', roughness: 0.7, metalness: 0.05, sheen: 0.35, sheenRoughness: 0.5 }),
  skinMedium: new THREE.MeshPhysicalMaterial({ color: '#b09070', roughness: 0.7, metalness: 0.05, sheen: 0.35, sheenRoughness: 0.5 }),
  skinDark: new THREE.MeshPhysicalMaterial({ color: '#8a6a50', roughness: 0.7, metalness: 0.05, sheen: 0.35, sheenRoughness: 0.5 }),
  skinShadowLight: new THREE.MeshPhysicalMaterial({ color: '#b89a72', roughness: 0.7, sheen: 0.25, sheenRoughness: 0.5 }),
  skinShadowMed: new THREE.MeshPhysicalMaterial({ color: '#9a7a60', roughness: 0.7, sheen: 0.25, sheenRoughness: 0.5 }),
  hairDark: new THREE.MeshPhysicalMaterial({ color: '#2a1e12', roughness: 0.9, sheen: 0.15, sheenRoughness: 0.4 }),
  hairBrown: new THREE.MeshPhysicalMaterial({ color: '#4a3020', roughness: 0.9, sheen: 0.15, sheenRoughness: 0.4 }),
  hairGray: new THREE.MeshPhysicalMaterial({ color: '#888890', roughness: 0.9, sheen: 0.15, sheenRoughness: 0.4 }),
  hairBlack: new THREE.MeshPhysicalMaterial({ color: '#0e0a08', roughness: 0.9, sheen: 0.15, sheenRoughness: 0.4 }),
  sneaker: new THREE.MeshStandardMaterial({ color: '#1a1a1a', roughness: 0.9, metalness: 0.05 }),
  sole: new THREE.MeshStandardMaterial({ color: '#e8e0d8', roughness: 0.95 }),
  metalGray: new THREE.MeshStandardMaterial({ color: '#888', roughness: 0.3, metalness: 0.8 }),
  metalDark: new THREE.MeshStandardMaterial({ color: '#555', roughness: 0.3, metalness: 0.8 }),
  earbuds: new THREE.MeshStandardMaterial({ color: '#e8e8e8', roughness: 0.3, metalness: 0.2 }),
  cord: new THREE.MeshStandardMaterial({ color: '#e8e8e8', roughness: 0.5 }),
  drawstring: new THREE.MeshStandardMaterial({ color: '#ccc', roughness: 0.6 }),
  bookPages: new THREE.MeshStandardMaterial({ color: '#f0ece0', roughness: 0.9 }),
  nameTag: new THREE.MeshStandardMaterial({ color: '#ffffff', emissive: '#f0c040', emissiveIntensity: 0.3, roughness: 0.3, transparent: true, opacity: 0.8 }),
};

/* ─── Merged geometries (same material → fewer draw calls) ─── */
function mergeWithTransform(
  geo: THREE.BufferGeometry,
  position: [number, number, number],
  rotation?: [number, number, number],
  scale?: [number, number, number],
): THREE.BufferGeometry {
  const clone = geo.clone();
  const m = new THREE.Matrix4().compose(
    new THREE.Vector3(...position),
    new THREE.Quaternion().setFromEuler(new THREE.Euler(...(rotation ?? [0, 0, 0]))),
    new THREE.Vector3(...(scale ?? [1, 1, 1])),
  );
  clone.applyMatrix4(m);
  return clone;
}

export type MergePart = {
  geo: THREE.BufferGeometry;
  position: [number, number, number];
  rotation?: [number, number, number];
  scale?: [number, number, number];
};

export function buildMerged(parts: MergePart[]): THREE.BufferGeometry {
  const geos = parts.map(p => mergeWithTransform(p.geo, p.position, p.rotation, p.scale));
  const result = mergeGeometries(geos);
  geos.forEach(g => g.dispose());
  return result!;
}

/** Mouth line + both corners → single draw call */
export const mergedGeo = {
  mouthWithCornersDown: buildMerged([
    { geo: sharedGeo.mouthLine, position: [0, -0.035, 0.095] },
    { geo: sharedGeo.mouthCorner, position: [-0.025, -0.032, 0.094], rotation: [0, 0, -0.3] },
    { geo: sharedGeo.mouthCorner, position: [0.025, -0.032, 0.094], rotation: [0, 0, 0.3] },
  ]),
  mouthLineOnly: buildMerged([
    { geo: sharedGeo.mouthLine, position: [0, -0.035, 0.095] },
  ]),
  /** Gray hair cluster (Albert/Vera style) */
  hairGrayCluster: buildMerged([
    { geo: sharedGeo.hairSphere, position: [0, 0.09, -0.01] },
    { geo: sharedGeo.hairSide, position: [-0.075, 0.04, 0.0] },
    { geo: sharedGeo.hairSide, position: [0.075, 0.04, 0.0] },
    { geo: sharedGeo.hairBack, position: [0, 0.06, -0.075] },
  ]),
  /** Standard dark hair sides + back */
  hairDarkSidesBack: buildMerged([
    { geo: sharedGeo.hairTuft, position: [-0.08, 0.03, 0.02] },
    { geo: sharedGeo.hairTuft, position: [0.08, 0.03, 0.02] },
    { geo: sharedGeo.hairBack, position: [0, 0.04, -0.07] },
  ]),
  /** Metal rivets pair */
  rivetPair: buildMerged([
    { geo: sharedGeo.metalRivet, position: [-0.04, 0.02, 0.08] },
    { geo: sharedGeo.metalRivet, position: [0.04, 0.02, 0.08] },
  ]),
  /** Suit buttons pair */
  suitButtons: buildMerged([
    { geo: sharedGeo.metalButton, position: [0, 0.0, 0.118] },
    { geo: sharedGeo.metalButton, position: [0, -0.08, 0.118] },
  ]),
  /** Jacket pockets pair (horizontal line) */
  pocketLinePair: buildMerged([
    { geo: sharedGeo.pocketLine, position: [-0.12, -0.08, 0.132] },
    { geo: sharedGeo.pocketLine, position: [0.12, -0.08, 0.132] },
  ]),
  /** Jacket lapels pair */
  lapelPair: buildMerged([
    { geo: sharedGeo.lapelBox, position: [-0.06, 0.12, 0.135], rotation: [0, 0, 0.25] },
    { geo: sharedGeo.lapelBox, position: [0.06, 0.12, 0.135], rotation: [0, 0, -0.25] },
  ]),
  /** Elbow patches pair */
  elbowPatchPair: buildMerged([
    { geo: sharedGeo.elbowPatch, position: [0.24, -0.1, -0.06], rotation: [0.3, 0, 0] },
    { geo: sharedGeo.elbowPatch, position: [-0.24, -0.1, -0.06], rotation: [0.3, 0, 0] },
  ]),
  /** Drawstrings pair */
  drawstringPair: buildMerged([
    { geo: sharedGeo.drawstringLong, position: [-0.02, 0.15, 0.115] },
    { geo: sharedGeo.drawstringShort, position: [0.02, 0.12, 0.115] },
  ]),
  /** Glasses temples pair (scholarly) */
  glassesTemples: buildMerged([
    { geo: sharedGeo.glassesTemple, position: [-0.07, 0, -0.04], rotation: [0, Math.PI * 0.15, 0] },
    { geo: sharedGeo.glassesTemple, position: [0.07, 0, -0.04], rotation: [0, -Math.PI * 0.15, 0] },
  ]),
  /** Glasses lenses pair (scholarly) */
  glassesLenses: buildMerged([
    { geo: sharedGeo.glassesLens, position: [-0.04, 0, 0] },
    { geo: sharedGeo.glassesLens, position: [0.04, 0, 0] },
  ]),
  /** Glasses lenses pair (round/Kate) */
  glassesLensesRound: buildMerged([
    { geo: sharedGeo.glassesLensRound, position: [-0.038, 0, 0] },
    { geo: sharedGeo.glassesLensRound, position: [0.038, 0, 0] },
  ]),
  /** Glasses temples pair (round/Kate) */
  glassesTemplesRound: buildMerged([
    { geo: sharedGeo.glassesTempleRound, position: [-0.065, 0, -0.04], rotation: [0, Math.PI * 0.15, 0] },
    { geo: sharedGeo.glassesTempleRound, position: [0.065, 0, -0.04], rotation: [0, -Math.PI * 0.15, 0] },
  ]),
  /** Earbuds cord pair */
  earbudCords: buildMerged([
    { geo: boxGeo(0.08, 0.003, 0.003), position: [-0.05, -0.04, 0.08], rotation: [0, 0, 0.3] },
    { geo: boxGeo(0.08, 0.003, 0.003), position: [0.05, -0.04, 0.08], rotation: [0, 0, -0.3] },
  ]),
  /** Cyber accent lines pair (Lena) */
  cyberAccentPair: buildMerged([
    { geo: boxGeo(0.005, 0.20, 0.005), position: [-0.10, 0.06, 0.105] },
    { geo: boxGeo(0.005, 0.20, 0.005), position: [0.10, 0.06, 0.105] },
  ]),
  /** Hood side shadows pair (Lena) */
  hoodShadowPair: buildMerged([
    { geo: boxGeo(0.02, 0.08, 0.06), position: [-0.10, -0.02, 0.04] },
    { geo: boxGeo(0.02, 0.08, 0.06), position: [0.10, -0.02, 0.04] },
  ]),
  /** Scarf drape ears pair (Zarema) */
  scarfEarPair: buildMerged([
    { geo: boxGeo(0.03, 0.08, 0.06), position: [-0.09, -0.03, 0.02] },
    { geo: boxGeo(0.03, 0.08, 0.06), position: [0.09, -0.03, 0.02] },
  ]),
  /** Coat pocket pair */
  coatPocketPair: buildMerged([
    { geo: boxGeo(0.06, 0.06, 0.005), position: [-0.10, -0.10, 0.115] },
    { geo: boxGeo(0.06, 0.06, 0.005), position: [0.10, -0.10, 0.115] },
  ]),
  /** Scarf tail pair (Vera) */
  scarfTailPair: buildMerged([
    { geo: boxGeo(0.04, 0.22, 0.01), position: [-0.06, 0.02, 0.13], rotation: [0, 0, 0.1] },
    { geo: boxGeo(0.04, 0.22, 0.01), position: [0.06, 0.02, 0.13], rotation: [0, 0, -0.1] },
  ]),
  /** Tool belt pouches pair */
  beltPouchPair: buildMerged([
    { geo: boxGeo(0.04, 0.06, 0.03), position: [-0.14, -0.22, 0.14] },
    { geo: boxGeo(0.04, 0.06, 0.03), position: [0.14, -0.22, 0.14] },
  ]),
  /** Armor belt pouches pair (Oleg) */
  armorPouchPair: buildMerged([
    { geo: boxGeo(0.05, 0.06, 0.03), position: [-0.16, -0.24, 0.15] },
    { geo: boxGeo(0.05, 0.06, 0.03), position: [0.16, -0.24, 0.15] },
  ]),
  /** Cardigan buttons triple */
  cardiganButtons: buildMerged([
    { geo: sharedGeo.metalButtonSm, position: [-0.02, 0.08, 0.112] },
    { geo: sharedGeo.metalButtonSm, position: [-0.02, 0.02, 0.112] },
    { geo: sharedGeo.metalButtonSm, position: [-0.02, -0.04, 0.112] },
  ]),
  /** Hair peek below cap pair */
  hairCapPeekPair: buildMerged([
    { geo: sharedGeo.hairTuftSm, position: [-0.08, -0.02, 0.02] },
    { geo: sharedGeo.hairTuftSm, position: [0.08, -0.02, 0.02] },
  ]),
  /** Sergey bedhead tufts */
  sergeyHairTufts: buildMerged([
    { geo: sharedGeo.hairTuftMd, position: [-0.06, 0.06, 0.03] },
    { geo: sharedGeo.hairTuftMd, position: [0.06, 0.06, 0.03] },
  ]),
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

/** Hair material — cached per color */
export function hairMat(color: string): THREE.MeshStandardMaterial {
  switch (color) {
    case '#2a1e12': return sharedMat.hairDark;
    case '#4a3020': return sharedMat.hairBrown;
    case '#888890': return sharedMat.hairGray;
    case '#0e0a08': return sharedMat.hairBlack;
    case '#5a3020': return npcMat({ color, roughness: 0.9 });
    case '#3a2a18': return npcMat({ color, roughness: 0.9 });
    default: return npcMat({ color, roughness: 0.9 });
  }
}

/** Metal accent — gray or dark */
export function metalMat(color = '#888', metalness = 0.8, roughness = 0.3): THREE.MeshStandardMaterial {
  if (color === '#888' && metalness === 0.8) return sharedMat.metalGray;
  if (color === '#555') return sharedMat.metalDark;
  return npcMat({ color, roughness, metalness });
}

/** Glowing screen / holographic display */
export function glowScreenMat(color: string, intensity = 0.5, opacity = 0.6): THREE.MeshStandardMaterial {
  return npcMat({ color, emissive: color, emissiveIntensity: intensity, roughness: 0.1, transparent: true, opacity });
}

/** Stubble overlay */
export function stubbleMat(color: string, opacity = 0.2): THREE.MeshStandardMaterial {
  return npcMat({ color, roughness: 0.9, transparent: true, opacity });
}

/** Emissive accent glow */
export function emissiveMat(color: string, glow: string, intensity: number, roughness = 0.2, metalness = 0.8): THREE.MeshStandardMaterial {
  return npcMat({ color, emissive: glow, emissiveIntensity: intensity, roughness, metalness });
}

/** Default arm/leg width ratios relative to shared capsule radii */
export const DEFAULT_ARM_WIDTH = 0.048;
export const DEFAULT_FOREARM_WIDTH = 0.042;
export const DEFAULT_LEG_WIDTH = 0.058;
export const DEFAULT_LOWER_LEG_WIDTH = 0.05;

let sharedResourceSets: {
  geometries: Set<THREE.BufferGeometry>;
  materials: Set<THREE.Material>;
} | null = null;

/** Module-level procedural NPC assets — exclude from per-instance GPU dispose. */
export function getProceduralNpcSharedResourceSets(): {
  geometries: ReadonlySet<THREE.BufferGeometry>;
  materials: ReadonlySet<THREE.Material>;
} {
  if (!sharedResourceSets) {
    const geometries = new Set<THREE.BufferGeometry>();
    for (const geo of geoCache.values()) geometries.add(geo);
    for (const geo of Object.values(sharedGeo)) geometries.add(geo);
    for (const geo of Object.values(mergedGeo)) geometries.add(geo);

    const materials = new Set<THREE.Material>();
    for (const mat of matCache.values()) materials.add(mat);
    for (const mat of Object.values(sharedMat)) materials.add(mat);

    sharedResourceSets = { geometries, materials };
  }
  return sharedResourceSets;
}
