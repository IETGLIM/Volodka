#!/usr/bin/env node
/**
 * AAA GLTF processing pipeline.
 *
 * Input:  assets-source/ (recursive .glb)
 * Output: public/models/ (optimize, Draco, Meshopt, LODs)
 *
 * Requires: npx @gltf-transform/cli (no local install needed)
 *
 * Usage:
 *   npm run assets:process
 *   npm run assets:process -- --input assets-source/ai3dgen/npcs/male_02.glb
 *   npm run assets:process-catalog   # manifest-aware batch (NPCs, interiors)
 */

import { createReadStream, createWriteStream, existsSync, mkdirSync, readdirSync, renameSync, statSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { processGltfAsset } from './lib/gltfProcess.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const SOURCE_DIR = path.join(ROOT, 'assets-source');
const OUT_DIR = path.join(ROOT, 'public', 'models');
const BASIS_OUT = path.join(ROOT, 'public', 'basis');
const DRACO_OUT = path.join(ROOT, 'public', 'draco', 'gltf');

const inputArg = process.argv.indexOf('--input');
const singleInput = inputArg >= 0 ? process.argv[inputArg + 1] : null;

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
  processGltfAsset({
    root: ROOT,
    srcPath,
    outBase,
    layout: 'suffix-lod',
    exitOnFail: true,
  });
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
  console.log('Example: assets-source/ai3dgen/npcs/male_02.glb');
  console.log('Or run: npm run assets:process-catalog');
  process.exit(0);
}

for (const src of sources) {
  processAsset(src);
}

console.log('\n✓ Asset pipeline complete.');
console.log('  Register outputs in src/config/assetManifest.ts');
