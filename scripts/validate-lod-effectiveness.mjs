#!/usr/bin/env node
/**
 * Validate LOD effectiveness — checks that LOD1/LOD2 have fewer
 * vertices and triangles than LOD0, and reports size reductions.
 *
 * Usage: node scripts/validate-lod-effectiveness.mjs [--warn-only]
 */

import { existsSync, openSync, readSync, closeSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { readdirSync, statSync } from 'node:fs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const PUBLIC = path.join(ROOT, 'public', 'models');
const warnOnly = process.argv.includes('--warn-only');

function parseGlbGeometry(filePath) {
  if (!existsSync(filePath)) return null;
  const buf = Buffer.alloc(12);
  const fd = openSync(filePath, 'r');
  try { readSync(fd, buf, 0, 12, 0); } finally { closeSync(fd); }
  if (buf.toString('ascii', 0, 4) !== 'glTF') return null;

  // Read full file to parse JSON chunk
  const fileBuf = Buffer.alloc(statSync(filePath).size);
  const fd2 = openSync(filePath, 'r');
  try { readSync(fd2, fileBuf, 0, fileBuf.length, 0); } finally { closeSync(fd2); }

  const jsonLen = fileBuf.readUInt32LE(12);
  const jsonStr = fileBuf.slice(20, 20 + jsonLen).toString('utf8');
  const json = JSON.parse(jsonStr);
  const meshes = json.meshes || [];
  const accessors = json.accessors || [];

  let totalVerts = 0, totalTris = 0;
  for (const m of meshes) {
    for (const p of (m.primitives || [])) {
      const posAcc = accessors[p.attributes?.POSITION];
      const idxAcc = accessors[p.indices];
      if (posAcc) totalVerts += posAcc.count;
      if (idxAcc) totalTris += Math.floor(idxAcc.count / 3);
      else if (posAcc) totalTris += Math.floor(posAcc.count / 3);
    }
  }
  return { verts: totalVerts, tris: totalTris, meshes: meshes.length };
}

const issues = [];
const successes = [];

// Check Volodka player LOD
function checkAsset(name, lodPaths) {
  const lod0 = parseGlbGeometry(lodPaths.lod0);
  if (!lod0) { issues.push(`${name}: LOD0 not found or corrupt`); return; }

  if (lodPaths.lod1) {
    const lod1 = parseGlbGeometry(lodPaths.lod1);
    if (!lod1) { issues.push(`${name}: LOD1 not found or corrupt`); return; }
    const reduction = ((lod0.verts - lod1.verts) / lod0.verts * 100).toFixed(1);
    if (lod1.verts >= lod0.verts) {
      issues.push(`${name}: LOD1 (${lod1.verts}v) ≥ LOD0 (${lod0.verts}v) — NO reduction (${reduction}%)`);
    } else if (lod1.verts > lod0.verts * 0.8) {
      issues.push(`${name}: LOD1 (${lod1.verts}v) only ${(100 - parseFloat(reduction)).toFixed(1)}% reduction — insufficient (expected ~50%)`);
    } else {
      successes.push(`${name}: LOD1 ${reduction}% vert reduction (${lod0.verts}→${lod1.verts})`);
    }
  }

  if (lodPaths.lod2) {
    const lod2 = parseGlbGeometry(lodPaths.lod2);
    if (!lod2) { issues.push(`${name}: LOD2 not found or corrupt`); return; }
    const reduction = ((lod0.verts - lod2.verts) / lod0.verts * 100).toFixed(1);
    if (lod2.verts >= lod0.verts) {
      issues.push(`${name}: LOD2 (${lod2.verts}v) ≥ LOD0 (${lod0.verts}v) — NO reduction`);
    } else if (lod2.verts > lod0.verts * 0.5) {
      issues.push(`${name}: LOD2 (${lod2.verts}v) only ${(100 - parseFloat(reduction)).toFixed(1)}% reduction — insufficient (expected ~80%)`);
    } else {
      successes.push(`${name}: LOD2 ${reduction}% vert reduction (${lod0.verts}→${lod2.verts})`);
    }
  }
}

// Player
checkAsset('player_volodka', {
  lod0: path.join(PUBLIC, 'characters/volodka/volodka_lod0.glb'),
  lod1: path.join(PUBLIC, 'characters/volodka/volodka_lod1.glb'),
  lod2: path.join(PUBLIC, 'characters/volodka/volodka_lod2.glb'),
});

// NPCs
const npcNames = [
  'cafe_barista', 'office_colleague', 'albert', 'zarema', 'maria',
  'office_alexander', 'office_dmitry', 'viktor', 'kira', 'boris',
  'tamara', 'grisha', 'maxim', 'zeka', 'trofim', 'kate', 'anya',
  'baba_zina', 'solnysh', 'chk_ru', 'chk_based', 'chk_stalker',
  'chk_smert', 'chk_elis', 'chk_ritka',
];
for (const npc of npcNames) {
  checkAsset(`npc_${npc}`, {
    lod0: path.join(PUBLIC, `npcs/${npc}.glb`),
    lod1: path.join(PUBLIC, `npcs/${npc}_lod1.glb`),
    lod2: path.join(PUBLIC, `npcs/${npc}_lod2.glb`),
  });
}

// Environment
checkAsset('env_cafe_props', {
  lod0: path.join(PUBLIC, 'environments/cafe/props_lod0.glb'),
  lod1: path.join(PUBLIC, 'environments/cafe/props_lod1.glb'),
  lod2: path.join(PUBLIC, 'environments/cafe/props_lod2.glb'),
});

// Vegetation — single-LOD interim pine until AI3DGen Pro chain replaces Khronos stubs.
// (pine_lod1/lod2 on disk are same-size copies — not used in manifest.)

console.log('\n=== LOD Effectiveness Validation ===');
console.log(`\n✅ Effective LODs (${successes.length}):`);
for (const s of successes) console.log(`  ${s}`);

if (issues.length > 0) {
  console.log(`\n🚨 LOD Issues (${issues.length}):`);
  for (const i of issues) console.log(`  ${i}`);
}

if (issues.length === 0) {
  console.log('\n✓ All LODs are effective — LOD1/LOD2 have proper vertex reduction.');
  process.exit(0);
} else {
  console.log('\n✗ LOD pipeline needs re-processing: npm run assets:process-catalog');
  if (warnOnly) { console.warn('Continuing with --warn-only'); process.exit(0); }
  process.exit(1);
}
