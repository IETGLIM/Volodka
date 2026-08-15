/**
 * Pillar 1 — Procedural SDF world (Unity Job System + Burst → Worker/main-thread mesh).
 * Hard architectural mixes + surface-nets with weld + analytic normals.
 */

import { BufferGeometry, Float32BufferAttribute, Vector3 } from 'three';
import { fbm2, fbm3, hash2 } from './noise';
import type { ProceduralAaaParams } from './params';

/** Smooth minimum (polynomial) — soft blend for terrain/rocks only. */
export function smin(a: number, b: number, k: number): number {
  const h = Math.max(k - Math.abs(a - b), 0) / Math.max(1e-6, k);
  return Math.min(a, b) - h * h * k * 0.25;
}

/** Smooth maximum — carves without melting edges. */
export function smax(a: number, b: number, k: number): number {
  return -smin(-a, -b, k);
}

/** Hard min/max for crisp architecture (buildings, arches, bridges). */
export function hardMin(a: number, b: number): number {
  return Math.min(a, b);
}

export function hardMax(a: number, b: number): number {
  return Math.max(a, b);
}

export function sdSphere(p: Vector3, c: Vector3, r: number): number {
  return p.distanceTo(c) - r;
}

export function sdBox(p: Vector3, c: Vector3, b: Vector3): number {
  const q = new Vector3(
    Math.abs(p.x - c.x) - b.x,
    Math.abs(p.y - c.y) - b.y,
    Math.abs(p.z - c.z) - b.z,
  );
  const outside = Math.hypot(Math.max(q.x, 0), Math.max(q.y, 0), Math.max(q.z, 0));
  const inside = Math.min(Math.max(q.x, q.y, q.z), 0);
  return outside + inside;
}

/** Infinite cylinder along Y through center xz. */
export function sdCylinderY(p: Vector3, c: Vector3, r: number): number {
  return Math.hypot(p.x - c.x, p.z - c.z) - r;
}

/**
 * Arch: solid box with a cylindrical tunnel carved through Z (or X).
 * axis='z' → opening faces ±Z (street-facing).
 */
export function sdArch(
  p: Vector3,
  c: Vector3,
  half: Vector3,
  tunnelR: number,
  axis: 'x' | 'z' = 'z',
): number {
  const solid = sdBox(p, c, half);
  const cylC = c.clone();
  cylC.y = c.y - half.y * 0.15;
  let tunnel: number;
  if (axis === 'z') {
    tunnel = Math.hypot(p.x - cylC.x, p.y - cylC.y) - tunnelR;
  } else {
    tunnel = Math.hypot(p.z - cylC.z, p.y - cylC.y) - tunnelR;
  }
  // Cap tunnel height so it reads as an arch, not a full pipe
  const floorCut = p.y - (c.y - half.y);
  const cappedTunnel = hardMax(tunnel, -floorCut - 0.05);
  return hardMax(solid, -cappedTunnel);
}

/** Flat bridge deck + two pier boxes. */
export function sdBridge(
  p: Vector3,
  c: Vector3,
  length: number,
  width: number,
  deckThick: number,
  pierH: number,
): number {
  const deck = sdBox(
    p,
    new Vector3(c.x, c.y + pierH, c.z),
    new Vector3(length * 0.5, deckThick * 0.5, width * 0.5),
  );
  const pierL = sdBox(
    p,
    new Vector3(c.x - length * 0.35, c.y + pierH * 0.5, c.z),
    new Vector3(0.22, pierH * 0.5, width * 0.28),
  );
  const pierR = sdBox(
    p,
    new Vector3(c.x + length * 0.35, c.y + pierH * 0.5, c.z),
    new Vector3(0.22, pierH * 0.5, width * 0.28),
  );
  return hardMin(deck, hardMin(pierL, pierR));
}

export function sdCapsule(
  p: Vector3,
  a: Vector3,
  b: Vector3,
  r: number,
): number {
  const pa = p.clone().sub(a);
  const ba = b.clone().sub(a);
  const h = Math.max(0, Math.min(1, pa.dot(ba) / ba.lengthSq()));
  return pa.sub(ba.multiplyScalar(h)).length() - r;
}

/**
 * Domain-repetition window indent on facade faces — detail, not copy-paste blocks.
 * Only active near building AABB to avoid tiling the whole world.
 */
function facadeWindowCarve(
  p: Vector3,
  center: Vector3,
  half: Vector3,
  seed: number,
): number {
  // Local space
  const lx = p.x - center.x;
  const ly = p.y - center.y;
  const lz = p.z - center.z;
  // Only near exterior faces
  const nearX = Math.abs(Math.abs(lx) - half.x) < 0.35;
  const nearZ = Math.abs(Math.abs(lz) - half.z) < 0.35;
  if (!nearX && !nearZ) return 1e3;

  const cell = 1.15 + hash2(Math.floor(center.x * 10), Math.floor(center.z * 10), seed) * 0.35;
  const wx = ((lx % cell) + cell) % cell - cell * 0.5;
  const wy = ((ly % (cell * 0.85)) + cell * 0.85) % (cell * 0.85) - cell * 0.4;
  const inset = 0.07 + hash2(Math.floor(ly), Math.floor(lx + lz), seed) * 0.04;
  const win = sdBox(
    new Vector3(nearZ ? wx : 0, wy, nearX ? wx : 0),
    new Vector3(0, 0, 0),
    new Vector3(nearZ ? 0.28 : inset, 0.22, nearX ? 0.28 : inset),
  );
  return win - inset * 0.15;
}

/**
 * Roof cornice + corner pilaster — crisp silhouette read without repeating modules.
 */
function facadeCornicePilaster(
  p: Vector3,
  center: Vector3,
  half: Vector3,
  seed: number,
): number {
  const topY = center.y + half.y;
  const cornice = sdBox(
    p,
    new Vector3(center.x, topY - 0.08, center.z),
    new Vector3(half.x + 0.12, 0.08, half.z + 0.12),
  );
  const corner = hash2(Math.floor(center.x), Math.floor(center.z), seed);
  const px = center.x + (corner > 0.5 ? 1 : -1) * half.x;
  const pz = center.z + (corner > 0.35 ? 1 : -1) * half.z;
  const pilaster = sdBox(
    p,
    new Vector3(px, center.y, pz),
    new Vector3(0.12, half.y * 0.92, 0.12),
  );
  return hardMin(cornice, pilaster);
}

export type SdfPrimitiveKind =
  | 'building'
  | 'rock'
  | 'ruin'
  | 'ground'
  | 'arch'
  | 'bridge'
  | 'ruin_tier';

export interface SdfPrimitive {
  kind: SdfPrimitiveKind;
  center: Vector3;
  size: Vector3;
  radius?: number;
  /** For arch: tunnel radius; for bridge: pier height encoded in radius. */
  meta?: number;
  axis?: 'x' | 'z';
}

/** Unique non-repeating layout from seed — buildings / arches / bridges / multi-level ruins. */
export function generateWorldLayout(params: ProceduralAaaParams): SdfPrimitive[] {
  const { seed, buildingDensity, rockDensity, ruinDensity, terrainAmp } = params;
  const out: SdfPrimitive[] = [];

  out.push({
    kind: 'ground',
    center: new Vector3(0, -2.5 * terrainAmp, 0),
    size: new Vector3(28, 3 * terrainAmp, 28),
  });

  const buildingCount = Math.round(7 + buildingDensity * 12);
  for (let i = 0; i < buildingCount; i++) {
    const ang = hash2(i, 1, seed) * Math.PI * 2;
    const rad = 5.5 + hash2(i, 2, seed) * 11;
    const x = Math.cos(ang) * rad;
    const z = Math.sin(ang) * rad;
    if (Math.hypot(x, z) < 4.2) continue;
    const w = 1.1 + hash2(i, 3, seed) * 2.6;
    const d = 0.95 + hash2(i, 4, seed) * 2.2;
    const h = 2.8 + hash2(i, 5, seed) * (4.5 + buildingDensity * 7);
    // Occasional setback mid-floor for silhouette variety
    const tiers = hash2(i, 6, seed) > 0.55 ? 2 : 1;
    out.push({
      kind: 'building',
      center: new Vector3(x, (h / tiers) * 0.5, z),
      size: new Vector3(w * 0.5, (h / tiers) * 0.5, d * 0.5),
    });
    if (tiers === 2) {
      const shrink = 0.72 + hash2(i, 7, seed) * 0.12;
      out.push({
        kind: 'building',
        center: new Vector3(x, h * 0.55 + (h * 0.45) * 0.5, z),
        size: new Vector3(w * 0.5 * shrink, h * 0.225, d * 0.5 * shrink),
      });
    }
  }

  // Arches — street-facing gateways between clusters
  const archCount = Math.round(2 + buildingDensity * 3);
  for (let i = 0; i < archCount; i++) {
    const ang = hash2(i, 40, seed) * Math.PI * 2;
    const rad = 7 + hash2(i, 41, seed) * 8;
    const x = Math.cos(ang) * rad;
    const z = Math.sin(ang) * rad;
    if (Math.hypot(x, z) < 5) continue;
    const hw = 1.4 + hash2(i, 42, seed) * 0.8;
    const hh = 2.2 + hash2(i, 43, seed) * 1.4;
    const hd = 0.55 + hash2(i, 44, seed) * 0.35;
    const axis: 'x' | 'z' = hash2(i, 45, seed) > 0.5 ? 'z' : 'x';
    out.push({
      kind: 'arch',
      center: new Vector3(x, hh * 0.55, z),
      size: new Vector3(hw, hh * 0.55, hd),
      meta: 0.85 + hash2(i, 46, seed) * 0.45,
      axis,
    });
  }

  // Bridges — elevated decks spanning gaps
  const bridgeCount = Math.round(1 + ruinDensity * 2);
  for (let i = 0; i < bridgeCount; i++) {
    const x = (hash2(i, 50, seed) - 0.5) * 16;
    const z = (hash2(i, 51, seed) - 0.5) * 16;
    if (Math.hypot(x, z) < 6) continue;
    const len = 3.5 + hash2(i, 52, seed) * 4;
    const wid = 0.7 + hash2(i, 53, seed) * 0.5;
    const pierH = 1.4 + hash2(i, 54, seed) * 1.2;
    out.push({
      kind: 'bridge',
      center: new Vector3(x, 0, z),
      size: new Vector3(len, wid, 0.18),
      meta: pierH,
    });
  }

  const rockCount = Math.round(6 + rockDensity * 12);
  for (let i = 0; i < rockCount; i++) {
    const x = (hash2(i, 11, seed) - 0.5) * 22;
    const z = (hash2(i, 12, seed) - 0.5) * 22;
    if (Math.hypot(x, z) < 3) continue;
    const r = 0.35 + hash2(i, 13, seed) * 1.1 * rockDensity;
    out.push({
      kind: 'rock',
      center: new Vector3(x, r * 0.55, z),
      size: new Vector3(r, r * 0.7, r),
      radius: r,
    });
  }

  // Multi-level ruin stacks
  const ruinCount = Math.round(3 + ruinDensity * 7);
  for (let i = 0; i < ruinCount; i++) {
    const x = (hash2(i, 21, seed) - 0.5) * 18;
    const z = (hash2(i, 22, seed) - 0.5) * 18;
    if (Math.hypot(x, z) < 5) continue;
    const levels = 1 + Math.floor(hash2(i, 26, seed) * 3);
    let yBase = 0;
    for (let lv = 0; lv < levels; lv++) {
      const h = 0.9 + hash2(i, 23 + lv, seed) * 1.8;
      const ox = (hash2(i, 30 + lv, seed) - 0.5) * 0.6;
      const oz = (hash2(i, 35 + lv, seed) - 0.5) * 0.6;
      out.push({
        kind: lv === 0 ? 'ruin' : 'ruin_tier',
        center: new Vector3(x + ox, yBase + h * 0.4, z + oz),
        size: new Vector3(
          0.35 + hash2(i, 24 + lv, seed) * 0.75 * (1 - lv * 0.12),
          h * 0.4,
          0.3 + hash2(i, 25 + lv, seed) * 0.55 * (1 - lv * 0.1),
        ),
      });
      yBase += h * 0.75;
    }
  }

  return out;
}

const _p = new Vector3();

export function sampleWorldSdf(
  x: number,
  y: number,
  z: number,
  layout: SdfPrimitive[],
  params: ProceduralAaaParams,
): number {
  _p.set(x, y, z);
  const h =
    fbm2(x * 0.08 + params.seed * 0.01, z * 0.08, 4, 2, 0.5, params.seed) * params.terrainAmp
    - 0.15;
  let d = y - h;

  const kSoft = Math.max(0.15, params.sdfSmoothK * 0.45); // rocks/terrain only

  for (const prim of layout) {
    if (prim.kind === 'ground') continue;
    let pd: number;
    if (prim.kind === 'rock' && prim.radius != null) {
      pd = sdSphere(_p, prim.center, prim.radius);
      pd -= fbm3(x, y, z, 2, params.seed + 9) * 0.1;
      d = smin(d, pd, kSoft);
      continue;
    }
    if (prim.kind === 'arch') {
      pd = sdArch(_p, prim.center, prim.size, prim.meta ?? 1, prim.axis ?? 'z');
      d = hardMin(d, pd);
      continue;
    }
    if (prim.kind === 'bridge') {
      pd = sdBridge(
        _p,
        prim.center,
        prim.size.x,
        prim.size.y,
        prim.size.z,
        prim.meta ?? 1.5,
      );
      d = hardMin(d, pd);
      continue;
    }
    // Buildings / ruins — hard union + window carve + cornice/pilaster silhouette
    pd = sdBox(_p, prim.center, prim.size);
    if (prim.kind === 'building' && params.sdfResolution >= 40) {
      const carve = facadeWindowCarve(_p, prim.center, prim.size, params.seed);
      pd = hardMax(pd, -carve);
      const trim = facadeCornicePilaster(_p, prim.center, prim.size, params.seed);
      pd = hardMin(pd, trim);
    }
    d = hardMin(d, pd);
  }

  // Reduced displace so buildings stay sharp (was melting silhouettes)
  const dispScale = params.perlinDisplace * (y < 1.2 ? 1 : 0.35);
  d -= fbm3(x * 0.35, y * 0.35, z * 0.35, 3, params.seed) * dispScale;
  return d;
}

/** Classic marching cubes edge table (12 edges × 2 verts). */
const EDGE_TABLE: readonly [number, number][] = [
  [0, 1], [1, 2], [2, 3], [3, 0],
  [4, 5], [5, 6], [6, 7], [7, 4],
  [0, 4], [1, 5], [2, 6], [3, 7],
];

const CORNER_OFFSETS: readonly [number, number, number][] = [
  [0, 0, 0], [1, 0, 0], [1, 0, 1], [0, 0, 1],
  [0, 1, 0], [1, 1, 0], [1, 1, 1], [0, 1, 1],
];

function quantKey(x: number, y: number, z: number, q: number): string {
  return `${Math.round(x * q)},${Math.round(y * q)},${Math.round(z * q)}`;
}

/**
 * Dense SDF → BufferGeometry via improved surface-nets:
 * - cell vertex at average of edge crossings
 * - quads across sign-changing grid edges (4 adjacent cells)
 * - fan fallback for isolated cells
 * - vertex weld + averaged analytic SDF normals
 */
export function buildSdfWorldGeometry(
  params: ProceduralAaaParams,
  bounds = { min: -14, max: 14, yMin: -1.5, yMax: 12 },
): BufferGeometry {
  const layout = generateWorldLayout(params);
  const res = Math.max(24, Math.min(96, Math.round(params.sdfResolution)));
  const { min, max, yMin, yMax } = bounds;
  const sizeXZ = max - min;
  const sizeY = yMax - yMin;
  const nx = res;
  const ny = Math.max(18, Math.round(res * 0.6));
  const nz = res;
  const dx = sizeXZ / (nx - 1);
  const dy = sizeY / (ny - 1);
  const dz = sizeXZ / (nz - 1);

  const field = new Float32Array(nx * ny * nz);
  const idx = (ix: number, iy: number, iz: number) => iy * nx * nz + iz * nx + ix;
  for (let iy = 0; iy < ny; iy++) {
    const y = yMin + iy * dy;
    for (let iz = 0; iz < nz; iz++) {
      const z = min + iz * dz;
      for (let ix = 0; ix < nx; ix++) {
        const x = min + ix * dx;
        field[idx(ix, iy, iz)] = sampleWorldSdf(x, y, z, layout, params);
      }
    }
  }

  const cellVert: (Vector3 | null)[] = new Array((nx - 1) * (ny - 1) * (nz - 1)).fill(null);
  const cIdx = (ix: number, iy: number, iz: number) => iy * (nx - 1) * (nz - 1) + iz * (nx - 1) + ix;

  const cornerPos = (ix: number, iy: number, iz: number, c: number): Vector3 => {
    const o = CORNER_OFFSETS[c]!;
    return new Vector3(
      min + (ix + o[0]) * dx,
      yMin + (iy + o[1]) * dy,
      min + (iz + o[2]) * dz,
    );
  };

  const lerpEdge = (
    ix: number,
    iy: number,
    iz: number,
    e: number,
    vals: number[],
  ): Vector3 => {
    const [a, b] = EDGE_TABLE[e]!;
    const va = vals[a]!;
    const vb = vals[b]!;
    const pa = cornerPos(ix, iy, iz, a);
    const pb = cornerPos(ix, iy, iz, b);
    const t = Math.abs(va - vb) < 1e-8 ? 0.5 : va / (va - vb);
    return pa.lerp(pb, Math.max(0, Math.min(1, t)));
  };

  // Pass 1: surface-nets cell vertices
  for (let iy = 0; iy < ny - 1; iy++) {
    for (let iz = 0; iz < nz - 1; iz++) {
      for (let ix = 0; ix < nx - 1; ix++) {
        let mask = 0;
        const vals = new Array<number>(8);
        for (let c = 0; c < 8; c++) {
          const o = CORNER_OFFSETS[c]!;
          vals[c] = field[idx(ix + o[0], iy + o[1], iz + o[2])]!;
          if (vals[c]! < 0) mask |= 1 << c;
        }
        if (mask === 0 || mask === 0xff) continue;

        const pts: Vector3[] = [];
        for (let e = 0; e < 12; e++) {
          const [a, b] = EDGE_TABLE[e]!;
          if ((vals[a]! < 0) !== (vals[b]! < 0)) {
            pts.push(lerpEdge(ix, iy, iz, e, vals));
          }
        }
        if (pts.length < 3) continue;
        const centroid = new Vector3();
        for (const p of pts) centroid.add(p);
        centroid.multiplyScalar(1 / pts.length);
        cellVert[cIdx(ix, iy, iz)] = centroid;
      }
    }
  }

  type Tri = [Vector3, Vector3, Vector3];
  const tris: Tri[] = [];

  const emitQuad = (
    v0: Vector3 | null | undefined,
    v1: Vector3 | null | undefined,
    v2: Vector3 | null | undefined,
    v3: Vector3 | null | undefined,
    flip: boolean,
  ) => {
    if (!v0 || !v1 || !v2 || !v3) return;
    if (flip) {
      tris.push([v0, v2, v1], [v0, v3, v2]);
    } else {
      tris.push([v0, v1, v2], [v0, v2, v3]);
    }
  };

  // Classic surface nets: for each grid edge with a sign change, emit a quad
  // from the up-to-4 dual vertices of cubes that share that edge.
  // Edges parallel to X
  for (let iy = 0; iy < ny; iy++) {
    for (let iz = 0; iz < nz; iz++) {
      for (let ix = 0; ix < nx - 1; ix++) {
        const a = field[idx(ix, iy, iz)]!;
        const b = field[idx(ix + 1, iy, iz)]!;
        if ((a < 0) === (b < 0)) continue;
        const flip = a >= 0;
        emitQuad(
          iy > 0 && iz > 0 ? cellVert[cIdx(ix, iy - 1, iz - 1)] : null,
          iy > 0 && iz < nz - 1 ? cellVert[cIdx(ix, iy - 1, iz)] : null,
          iy < ny - 1 && iz < nz - 1 ? cellVert[cIdx(ix, iy, iz)] : null,
          iy < ny - 1 && iz > 0 ? cellVert[cIdx(ix, iy, iz - 1)] : null,
          flip,
        );
      }
    }
  }
  // Edges parallel to Y
  for (let iy = 0; iy < ny - 1; iy++) {
    for (let iz = 0; iz < nz; iz++) {
      for (let ix = 0; ix < nx; ix++) {
        const a = field[idx(ix, iy, iz)]!;
        const b = field[idx(ix, iy + 1, iz)]!;
        if ((a < 0) === (b < 0)) continue;
        const flip = a >= 0;
        emitQuad(
          ix > 0 && iz > 0 ? cellVert[cIdx(ix - 1, iy, iz - 1)] : null,
          ix < nx - 1 && iz > 0 ? cellVert[cIdx(ix, iy, iz - 1)] : null,
          ix < nx - 1 && iz < nz - 1 ? cellVert[cIdx(ix, iy, iz)] : null,
          ix > 0 && iz < nz - 1 ? cellVert[cIdx(ix - 1, iy, iz)] : null,
          flip,
        );
      }
    }
  }
  // Edges parallel to Z
  for (let iy = 0; iy < ny; iy++) {
    for (let iz = 0; iz < nz - 1; iz++) {
      for (let ix = 0; ix < nx; ix++) {
        const a = field[idx(ix, iy, iz)]!;
        const b = field[idx(ix, iy, iz + 1)]!;
        if ((a < 0) === (b < 0)) continue;
        const flip = a >= 0;
        emitQuad(
          ix > 0 && iy > 0 ? cellVert[cIdx(ix - 1, iy - 1, iz)] : null,
          ix < nx - 1 && iy > 0 ? cellVert[cIdx(ix, iy - 1, iz)] : null,
          ix < nx - 1 && iy < ny - 1 ? cellVert[cIdx(ix, iy, iz)] : null,
          ix > 0 && iy < ny - 1 ? cellVert[cIdx(ix - 1, iy, iz)] : null,
          flip,
        );
      }
    }
  }

  // Weld vertices + accumulate normals
  const weldQ = Math.max(24, Math.round(res * 1.4));
  const weldMap = new Map<string, number>();
  const positions: number[] = [];
  const normalAccum: Vector3[] = [];
  const indices: number[] = [];

  const getOrAdd = (v: Vector3): number => {
    const k = quantKey(v.x, v.y, v.z, weldQ);
    const hit = weldMap.get(k);
    if (hit !== undefined) return hit;
    const id = positions.length / 3;
    positions.push(v.x, v.y, v.z);
    normalAccum.push(new Vector3());
    weldMap.set(k, id);
    return id;
  };

  const eps = Math.max(dx, dy, dz) * 0.35;
  for (const [a, b, c] of tris) {
    const ia = getOrAdd(a);
    const ib = getOrAdd(b);
    const ic = getOrAdd(c);
    if (ia === ib || ib === ic || ia === ic) continue;
    const ab = b.clone().sub(a);
    const ac = c.clone().sub(a);
    const fn = ab.cross(ac);
    if (fn.lengthSq() < 1e-12) continue;
    const cx = (a.x + b.x + c.x) / 3;
    const cy = (a.y + b.y + c.y) / 3;
    const cz = (a.z + b.z + c.z) / 3;
    const gx =
      sampleWorldSdf(cx + eps, cy, cz, layout, params)
      - sampleWorldSdf(cx - eps, cy, cz, layout, params);
    const gy =
      sampleWorldSdf(cx, cy + eps, cz, layout, params)
      - sampleWorldSdf(cx, cy - eps, cz, layout, params);
    const gz =
      sampleWorldSdf(cx, cy, cz + eps, layout, params)
      - sampleWorldSdf(cx, cy, cz - eps, layout, params);
    const sn = new Vector3(gx, gy, gz);
    fn.normalize();
    if (sn.lengthSq() > 1e-10) {
      sn.normalize().multiplyScalar(-1);
      if (fn.dot(sn) < 0) fn.negate();
      sn.lerp(fn, 0.2).normalize();
      normalAccum[ia]!.add(sn);
      normalAccum[ib]!.add(sn);
      normalAccum[ic]!.add(sn);
    } else {
      normalAccum[ia]!.add(fn);
      normalAccum[ib]!.add(fn);
      normalAccum[ic]!.add(fn);
    }
    indices.push(ia, ib, ic);
  }

  const normals = new Float32Array(positions.length);
  for (let i = 0; i < normalAccum.length; i++) {
    const n = normalAccum[i]!;
    if (n.lengthSq() < 1e-10) n.set(0, 1, 0);
    else n.normalize();
    normals[i * 3] = n.x;
    normals[i * 3 + 1] = n.y;
    normals[i * 3 + 2] = n.z;
  }

  const geo = new BufferGeometry();
  geo.setAttribute('position', new Float32BufferAttribute(positions, 3));
  geo.setAttribute('normal', new Float32BufferAttribute(normals, 3));
  geo.setIndex(indices);
  geo.computeBoundingSphere();
  return geo;
}

/** LOD helper: lower res for distant chunks. */
export function buildSdfWorldLod(
  params: ProceduralAaaParams,
  lod: 0 | 1 | 2,
): BufferGeometry {
  const resScale = lod === 0 ? 1 : lod === 1 ? 0.7 : 0.45;
  return buildSdfWorldGeometry({
    ...params,
    sdfResolution: Math.round(params.sdfResolution * resScale),
  });
}
