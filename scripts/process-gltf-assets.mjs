#!/usr/bin/env node
/**
 * AAA GLTF processing pipeline.
 *
 * Input:  assets-source/ (recursive .glb)
 * Output: public/models/ (Draco, Meshopt, LODs, KTX2)
 *
 * Requires: npx @gltf-transform/cli (no local install needed)
 *
 * Usage:
 *   npm run assets:process
 *   npm run assets:process -- --input assets-source/environments/cafe.glb
 */

import { spawnSync } from 'node:child_process';
import { createReadStream, createWriteStream, existsSync, mkdirSync, readdirSync, renameSync, statSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const SOURCE_DIR = path.join(ROOT, 'assets-source');
const OUT_DIR = path.join(ROOT, 'public', 'models');
const BASIS_OUT = path.join(ROOT, 'public', 'basis');
const DRACO_OUT = path.join(ROOT, 'public', 'draco', 'gltf');

const inputArg = process.argv.indexOf('--input');
const singleInput = inputArg >= 0 ? process.argv[inputArg + 1] : null;

function run(cmd, args, label) {
  console.log(`\n▶ ${label}`);
  const result = spawnSync(cmd, args, { stdio: 'inherit', shell: true, cwd: ROOT });
  if (result.status !== 0) {
    console.error(`✗ Failed: ${label}`);
    process.exit(result.status ?? 1);
  }
}

function collectGlbs(dir) {
  if (!existsSync(dir)) return [];
  const out = [];
  for (const entry of readdirSync(dir)) {
    const full = path.join(dir, entry);
    if (statSync(full).isDirectory()) out.push(...collectGlbs(full));
    else if (entry.endsWith('.glb') || entry.endsWith('.gltf')) out.push(full);
  }
  return out;
}

function ensureDirs() {
  for (const d of [OUT_DIR, BASIS_OUT, DRACO_OUT]) {
    if (!existsSync(d)) mkdirSync(d, { recursive: true });
  }
}

function processAsset(srcPath) {
  const rel = path.relative(SOURCE_DIR, srcPath);
  const base = rel.replace(/\.(glb|gltf)$/i, '');
  const outBase = path.join(OUT_DIR, base);
  mkdirSync(path.dirname(outBase), { recursive: true });

  const lod0 = `${outBase}_lod0.glb`;
  const draco = `${outBase}.draco.glb`;
  const meshopt = `${outBase}.meshopt.glb`;
  const lod1 = `${outBase}_lod1.glb`;
  const lod2 = `${outBase}_lod2.glb`;

  // Base copy / optimize
  run('npx', ['@gltf-transform/cli', 'copy', srcPath, lod0], `copy → ${path.relative(ROOT, lod0)}`);

  // Draco mesh compression
  run('npx', ['@gltf-transform/cli', 'draco', lod0, draco], `draco → ${path.relative(ROOT, draco)}`);

  // Meshopt compression (better for GPU vertex fetch)
  run('npx', ['@gltf-transform/cli', 'meshopt', lod0, meshopt], `meshopt → ${path.relative(ROOT, meshopt)}`);

  // LOD chain (simplify 50% / 20%)
  run(
    'npx',
    ['@gltf-transform/cli', 'simplify', lod0, lod1, '--ratio', '0.5'],
    `lod1 → ${path.relative(ROOT, lod1)}`,
  );
  run(
    'npx',
    ['@gltf-transform/cli', 'simplify', lod0, lod2, '--ratio', '0.2'],
    `lod2 → ${path.relative(ROOT, lod2)}`,
  );

  // KTX2 texture compression (Basis) — best-effort; requires texture in source
  const ktx2 = `${outBase}_atlas_1k.ktx2`;
  run(
    'npx',
    ['@gltf-transform/cli', 'uastc', lod0, ktx2, '--slots', 'baseColorTexture'],
    `ktx2 → ${path.relative(ROOT, ktx2)}`,
  );
}

function copyFileSafe(from, to) {
  mkdirSync(path.dirname(to), { recursive: true });
  if (existsSync(to) && statSync(to).size === statSync(from).size) return Promise.resolve();
  const tmp = `${to}.tmp`;
  return new Promise((resolve, reject) => {
    const rs = createReadStream(from);
    const ws = createWriteStream(tmp);
    rs.on('error', reject);
    ws.on('error', reject);
    ws.on('finish', () => {
      try {
        renameSync(tmp, to);
        resolve();
      } catch (err) {
        reject(err);
      }
    });
    rs.pipe(ws);
  });
}

async function copyDir(src, dest) {
  if (!existsSync(src)) return false;
  mkdirSync(dest, { recursive: true });
  for (const entry of readdirSync(src, { withFileTypes: true })) {
    const from = path.join(src, entry.name);
    const to = path.join(dest, entry.name);
    if (entry.isDirectory()) await copyDir(from, to);
    else await copyFileSafe(from, to);
  }
  return true;
}

async function copyTranscoders() {
  const threeBasis = path.join(ROOT, 'node_modules', 'three', 'examples', 'jsm', 'libs', 'basis');
  const threeDraco = path.join(ROOT, 'node_modules', 'three', 'examples', 'jsm', 'libs', 'draco', 'gltf');
  if (await copyDir(threeBasis, BASIS_OUT)) {
    console.log('Basis transcoder -> public/basis/');
  } else {
    console.warn('three.js Basis libs not found — run npm install');
  }
  if (await copyDir(threeDraco, DRACO_OUT)) {
    console.log('Draco decoder -> public/draco/gltf/');
  }
}

ensureDirs();
await copyTranscoders();

const sources = singleInput ? [path.resolve(singleInput)] : collectGlbs(SOURCE_DIR);

if (sources.length === 0) {
  console.log('No GLB/GLTF in assets-source/. Add models and re-run.');
  console.log('Example: assets-source/characters/volodka/volodka.glb');
  process.exit(0);
}

for (const src of sources) {
  processAsset(src);
}

console.log('\n✓ Asset pipeline complete.');
console.log('  Register outputs in src/config/assetManifest.ts');
