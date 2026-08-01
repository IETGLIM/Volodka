#!/usr/bin/env node
/**
 * Metre-scale walkable apartment envelope for volodka_room (AABB ≈ 5×3×7).
 * Named floor/wall/ceiling for AuthoredInteriorShell photo-PBR.
 * Crown/baseboard/jambs use ExtrudeGeometry profiles kept inside the room volume.
 */
import { mkdirSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { Blob } from 'node:buffer';
import * as THREE from 'three';
import { GLTFExporter } from 'three/examples/jsm/exporters/GLTFExporter.js';

if (!globalThis.Blob) globalThis.Blob = Blob;
if (!globalThis.FileReader) {
  globalThis.FileReader = class FileReader {
    result = null;
    onloadend = null;
    onerror = null;
    readAsArrayBuffer(blob) {
      Promise.resolve(blob.arrayBuffer())
        .then((buf) => {
          this.result = buf;
          this.onloadend?.({ target: this });
        })
        .catch((err) => this.onerror?.(err));
    }
  };
}

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const OUT = path.join(ROOT, 'public', 'models', 'interiors', 'apartment_envelope.glb');

const W = 5;
const D = 7;
const H = 3;
const T = 0.12;

function mat(color, roughness = 0.85) {
  return new THREE.MeshStandardMaterial({ color, roughness, metalness: 0.02 });
}

function box(name, sx, sy, sz, px, py, pz, color) {
  const mesh = new THREE.Mesh(new THREE.BoxGeometry(sx, sy, sz), mat(color));
  mesh.name = name;
  mesh.position.set(px, py, pz);
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  return mesh;
}

/** Profile in XY, extruded along +Z, then transformed via matrix. */
function molding(name, shape, length, color, roughness = 0.8) {
  const geo = new THREE.ExtrudeGeometry(shape, {
    depth: length,
    bevelEnabled: true,
    bevelThickness: 0.004,
    bevelSize: 0.003,
    bevelSegments: 1,
    curveSegments: 3,
  });
  geo.translate(0, 0, -length / 2);
  const mesh = new THREE.Mesh(geo, mat(color, roughness));
  mesh.name = name;
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  return mesh;
}

function crownShape() {
  const s = new THREE.Shape();
  // Profile grows +X (into room) and +Y (up)
  s.moveTo(0, 0);
  s.lineTo(0.04, 0);
  s.lineTo(0.038, 0.015);
  s.quadraticCurveTo(0.032, 0.032, 0.018, 0.04);
  s.lineTo(0, 0.045);
  s.lineTo(0, 0);
  return s;
}

function baseboardShape() {
  const s = new THREE.Shape();
  s.moveTo(0, 0);
  s.lineTo(0.032, 0);
  s.lineTo(0.032, 0.07);
  s.quadraticCurveTo(0.028, 0.085, 0.012, 0.09);
  s.lineTo(0, 0.09);
  s.lineTo(0, 0);
  return s;
}

function jambShape() {
  const s = new THREE.Shape();
  s.moveTo(0, 0);
  s.lineTo(0.055, 0);
  s.lineTo(0.055, 0.022);
  s.lineTo(0.022, 0.022);
  s.lineTo(0.022, 0.07);
  s.lineTo(0, 0.07);
  s.lineTo(0, 0);
  return s;
}

/** Seeded hash noise for plaster undulation (non-planar wall read). */
function hash2(ix, iy) {
  const n = Math.sin(ix * 127.1 + iy * 311.7) * 43758.5453;
  return n - Math.floor(n);
}

function displacedPlaster(name, width, height, segsW, segsH, amp = 0.012) {
  const geo = new THREE.PlaneGeometry(width, height, segsW, segsH);
  const pos = geo.attributes.position;
  for (let i = 0; i < pos.count; i++) {
    const x = pos.getX(i);
    const y = pos.getY(i);
    const nx = (x / width + 0.5) * segsW;
    const ny = (y / height + 0.5) * segsH;
    const n =
      (hash2(Math.floor(nx), Math.floor(ny)) * 0.55 +
        hash2(Math.floor(nx * 2.1), Math.floor(ny * 1.7)) * 0.3 +
        hash2(Math.floor(nx * 4.3), Math.floor(ny * 3.9)) * 0.15) *
      2 -
      1;
    pos.setZ(i, n * amp);
  }
  pos.needsUpdate = true;
  geo.computeVertexNormals();
  const mesh = new THREE.Mesh(geo, mat(0x9a94a8, 0.9));
  mesh.name = name;
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  return mesh;
}

function buildEnvelope() {
  const root = new THREE.Group();
  root.name = 'volodka_apartment_envelope';

  root.add(box('floor', W - 0.02, 0.08, D - 0.02, 0, 0.04, 0, 0x6b5438));
  root.add(box('ceiling', W - 0.02, 0.08, D - 0.02, 0, H - 0.04, 0, 0x2a3038));

  root.add(box('wall_back', W, H, T, 0, H / 2, -D / 2 + T / 2, 0x9a94a8));
  // Non-planar plaster face (into room) — breaks flat box silhouette under photo-PBR.
  const plasterBack = displacedPlaster('wall_back_plaster', W - 0.08, H - 0.2, 28, 18, 0.014);
  plasterBack.position.set(0, H / 2, -D / 2 + T + 0.01);
  root.add(plasterBack);

  const doorW = 1.0;
  const doorH = 2.2;
  const side = (W - doorW) / 2;
  root.add(box('wall_front_left', side, H, T, -W / 2 + side / 2, H / 2, D / 2 - T / 2, 0x9a94a8));
  root.add(box('wall_front_right', side, H, T, W / 2 - side / 2, H / 2, D / 2 - T / 2, 0x9a94a8));
  root.add(box('wall_front_lintel', doorW, H - doorH, T, 0, doorH + (H - doorH) / 2, D / 2 - T / 2, 0x9a94a8));

  root.add(box('wall_left', T, H, D - 2 * T, -W / 2 + T / 2, H / 2, 0, 0x9a94a8));
  const plasterLeft = displacedPlaster('wall_left_plaster', D - 0.28, H - 0.2, 32, 18, 0.013);
  plasterLeft.rotation.y = Math.PI / 2;
  plasterLeft.position.set(-W / 2 + T + 0.01, H / 2, 0);
  root.add(plasterLeft);

  const winW = 1.4;
  const winH = 1.2;
  const winCy = 1.5;
  const winCz = -2.0;
  const zMin = -D / 2 + T;
  const zMax = D / 2 - T;
  const winZ0 = winCz - winW / 2;
  const winZ1 = winCz + winW / 2;
  const southLen = Math.max(0.12, winZ0 - zMin);
  const northLen = Math.max(0.12, zMax - winZ1);
  const below = winCy - winH / 2;
  const above = H - (winCy + winH / 2);

  root.add(box('wall_right_south', T, H, southLen, W / 2 - T / 2, H / 2, zMin + southLen / 2, 0x9a94a8));
  root.add(box('wall_right_north', T, H, northLen, W / 2 - T / 2, H / 2, zMax - northLen / 2, 0x9a94a8));
  root.add(box('wall_right_below', T, below, winW, W / 2 - T / 2, below / 2, winCz, 0x9a94a8));
  root.add(box('wall_right_above', T, above, winW, W / 2 - T / 2, winCy + winH / 2 + above / 2, winCz, 0x9a94a8));
  root.add(box('wall_window_sill', 0.14, 0.035, winW + 0.06, W / 2 - T - 0.03, below + 0.015, winCz, 0x7a7488));

  // Door jambs — profile into room (−Z from front wall)
  const jl = molding('wall_door_jamb_left', jambShape(), doorH - 0.05, 0x5a4a38, 0.75);
  jl.rotation.set(Math.PI / 2, 0, Math.PI / 2);
  jl.position.set(-doorW / 2 + 0.01, doorH / 2, D / 2 - T - 0.01);
  root.add(jl);
  const jr = molding('wall_door_jamb_right', jambShape(), doorH - 0.05, 0x5a4a38, 0.75);
  jr.rotation.set(Math.PI / 2, 0, -Math.PI / 2);
  jr.position.set(doorW / 2 - 0.01, doorH / 2, D / 2 - T - 0.01);
  root.add(jr);
  const jh = molding('wall_door_jamb_header', jambShape(), doorW - 0.04, 0x5a4a38, 0.75);
  jh.rotation.set(0, Math.PI, 0);
  jh.position.set(0, doorH - 0.01, D / 2 - T - 0.01);
  root.add(jh);

  // Baseboards — profile into room from each wall
  const bbBack = molding('floor_baseboard_back', baseboardShape(), W - 0.28, 0x4a3d30);
  // rotY(-π/2): local +X → world +Z (into room from back wall)
  bbBack.rotation.set(0, -Math.PI / 2, 0);
  bbBack.position.set(0, 0, -D / 2 + T + 0.002);
  root.add(bbBack);

  const bbFrontL = molding('floor_baseboard_front_l', baseboardShape(), side - 0.08, 0x4a3d30);
  bbFrontL.rotation.set(0, Math.PI / 2, 0); // local +X → −Z (into room from front)
  bbFrontL.position.set(-W / 2 + side / 2, 0, D / 2 - T - 0.002);
  root.add(bbFrontL);
  const bbFrontR = molding('floor_baseboard_front_r', baseboardShape(), side - 0.08, 0x4a3d30);
  bbFrontR.rotation.set(0, Math.PI / 2, 0);
  bbFrontR.position.set(W / 2 - side / 2, 0, D / 2 - T - 0.002);
  root.add(bbFrontR);

  const bbLeft = molding('floor_baseboard_left', baseboardShape(), D - 0.32, 0x4a3d30);
  bbLeft.rotation.set(0, 0, 0); // +X into room from left wall
  bbLeft.position.set(-W / 2 + T + 0.002, 0, 0);
  root.add(bbLeft);

  const bbRight = molding('floor_baseboard_right', baseboardShape(), D - 0.32, 0x4a3d30);
  bbRight.rotation.set(0, Math.PI, 0); // +X → −X into room from right
  bbRight.position.set(W / 2 - T - 0.002, 0, 0);
  root.add(bbRight);

  // Crown
  const crBack = molding('ceiling_crown_back', crownShape(), W - 0.28, 0x4a4658);
  crBack.rotation.set(0, -Math.PI / 2, 0);
  crBack.position.set(0, H - 0.06, -D / 2 + T + 0.002);
  root.add(crBack);
  const crFront = molding('ceiling_crown_front', crownShape(), W - 0.28, 0x4a4658);
  crFront.rotation.set(0, Math.PI / 2, 0);
  crFront.position.set(0, H - 0.06, D / 2 - T - 0.002);
  root.add(crFront);
  const crLeft = molding('ceiling_crown_left', crownShape(), D - 0.32, 0x4a4658);
  crLeft.position.set(-W / 2 + T + 0.002, H - 0.06, 0);
  root.add(crLeft);
  const crRight = molding('ceiling_crown_right', crownShape(), D - 0.32, 0x4a4658);
  crRight.rotation.set(0, Math.PI, 0);
  crRight.position.set(W / 2 - T - 0.002, H - 0.06, 0);
  root.add(crRight);

  // Soft corner returns (inside volume)
  for (const [x, z, name] of [
    [-W / 2 + T + 0.03, -D / 2 + T + 0.03, 'wall_corner_sw'],
    [W / 2 - T - 0.03, -D / 2 + T + 0.03, 'wall_corner_se'],
    [-W / 2 + T + 0.03, D / 2 - T - 0.03, 'wall_corner_nw'],
    [W / 2 - T - 0.03, D / 2 - T - 0.03, 'wall_corner_ne'],
  ]) {
    const col = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.04, H - 0.25, 8), mat(0x8a8498, 0.88));
    col.name = name;
    col.position.set(x, H / 2, z);
    col.castShadow = true;
    root.add(col);
  }

  return root;
}

async function main() {
  const scene = buildEnvelope();
  scene.updateMatrixWorld(true);
  const box3 = new THREE.Box3().setFromObject(scene);
  const size = new THREE.Vector3();
  box3.getSize(size);
  console.log(
    `AABB ${size.x.toFixed(2)} × ${size.y.toFixed(2)} × ${size.z.toFixed(2)}  y ${box3.min.y.toFixed(2)}..${box3.max.y.toFixed(2)}`,
  );
  if (size.x > 5.4 || size.z > 7.4 || size.y > 3.3) {
    throw new Error(`Envelope AABB out of metre room budget: ${size.x}×${size.y}×${size.z}`);
  }

  const exporter = new GLTFExporter();
  const glb = await new Promise((resolve, reject) => {
    exporter.parse(
      scene,
      (result) => resolve(Buffer.from(result)),
      (err) => reject(err),
      { binary: true },
    );
  });
  mkdirSync(path.dirname(OUT), { recursive: true });
  writeFileSync(OUT, glb);
  console.log(`✓ wrote ${path.relative(ROOT, OUT)} (${glb.length} bytes)`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
