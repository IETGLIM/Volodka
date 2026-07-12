#!/usr/bin/env node
/**
 * Print world-space bounding boxes of GLB files (JSON chunk parse, no deps).
 * Walks the default scene graph with TRS transforms and accumulates
 * POSITION accessor min/max for every mesh primitive.
 *
 * Usage: node scripts/inspect-glb-bounds.mjs public/models/props/*.glb
 */

import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';

function parseGlbJson(filePath) {
  const buf = readFileSync(filePath);
  if (buf.readUInt32LE(0) !== 0x46546c67) throw new Error('not a GLB');
  const jsonLength = buf.readUInt32LE(12);
  return JSON.parse(buf.subarray(20, 20 + jsonLength).toString('utf8'));
}

/* Minimal 4x4 column-major matrix helpers */
function matIdentity() {
  return [1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1];
}
function matMultiply(a, b) {
  const out = new Array(16).fill(0);
  for (let c = 0; c < 4; c++) {
    for (let r = 0; r < 4; r++) {
      for (let k = 0; k < 4; k++) {
        out[c * 4 + r] += a[k * 4 + r] * b[c * 4 + k];
      }
    }
  }
  return out;
}
function matFromTrs(node) {
  if (node.matrix) return node.matrix;
  const [tx, ty, tz] = node.translation ?? [0, 0, 0];
  const [qx, qy, qz, qw] = node.rotation ?? [0, 0, 0, 1];
  const [sx, sy, sz] = node.scale ?? [1, 1, 1];
  const x2 = qx + qx, y2 = qy + qy, z2 = qz + qz;
  const xx = qx * x2, xy = qx * y2, xz = qx * z2;
  const yy = qy * y2, yz = qy * z2, zz = qz * z2;
  const wx = qw * x2, wy = qw * y2, wz = qw * z2;
  return [
    (1 - (yy + zz)) * sx, (xy + wz) * sx, (xz - wy) * sx, 0,
    (xy - wz) * sy, (1 - (xx + zz)) * sy, (yz + wx) * sy, 0,
    (xz + wy) * sz, (yz - wx) * sz, (1 - (xx + yy)) * sz, 0,
    tx, ty, tz, 1,
  ];
}
function transformPoint(m, [x, y, z]) {
  return [
    m[0] * x + m[4] * y + m[8] * z + m[12],
    m[1] * x + m[5] * y + m[9] * z + m[13],
    m[2] * x + m[6] * y + m[10] * z + m[14],
  ];
}

function inspect(filePath) {
  const gltf = parseGlbJson(filePath);
  const min = [Infinity, Infinity, Infinity];
  const max = [-Infinity, -Infinity, -Infinity];

  function visitMesh(meshIndex, worldMat) {
    const mesh = gltf.meshes?.[meshIndex];
    if (!mesh) return;
    for (const prim of mesh.primitives ?? []) {
      const accessor = gltf.accessors?.[prim.attributes?.POSITION];
      if (!accessor?.min || !accessor?.max) continue;
      // Transform all 8 corners of the local bbox
      for (const x of [accessor.min[0], accessor.max[0]]) {
        for (const y of [accessor.min[1], accessor.max[1]]) {
          for (const z of [accessor.min[2], accessor.max[2]]) {
            const p = transformPoint(worldMat, [x, y, z]);
            for (let i = 0; i < 3; i++) {
              if (p[i] < min[i]) min[i] = p[i];
              if (p[i] > max[i]) max[i] = p[i];
            }
          }
        }
      }
    }
  }

  function visitNode(nodeIndex, parentMat) {
    const node = gltf.nodes?.[nodeIndex];
    if (!node) return;
    const worldMat = matMultiply(parentMat, matFromTrs(node));
    if (node.mesh !== undefined) visitMesh(node.mesh, worldMat);
    for (const child of node.children ?? []) visitNode(child, worldMat);
  }

  const scene = gltf.scenes?.[gltf.scene ?? 0];
  for (const nodeIndex of scene?.nodes ?? []) visitNode(nodeIndex, matIdentity());

  if (!Number.isFinite(min[0])) return { size: null };
  return {
    size: [max[0] - min[0], max[1] - min[1], max[2] - min[2]],
    min,
    max,
  };
}

const args = process.argv.slice(2);
const files = [];
for (const arg of args) {
  const st = statSync(arg);
  if (st.isDirectory()) {
    for (const f of readdirSync(arg)) {
      if (f.endsWith('.glb')) files.push(join(arg, f));
    }
  } else {
    files.push(arg);
  }
}

console.log('file'.padEnd(46), 'W×H×D (m)'.padEnd(24), 'minY..maxY');
for (const f of files) {
  try {
    const { size, min, max } = inspect(f);
    if (!size) {
      console.log(f.padEnd(46), '(no POSITION min/max)');
      continue;
    }
    const fmt = (v) => v.toFixed(2);
    console.log(
      f.padEnd(46),
      `${fmt(size[0])} × ${fmt(size[1])} × ${fmt(size[2])}`.padEnd(24),
      `${fmt(min[1])} .. ${fmt(max[1])}`,
    );
  } catch (err) {
    console.log(f.padEnd(46), `ERROR: ${err.message}`);
  }
}
