#!/usr/bin/env node
/**
 * Process shipped catalog assets: Quaternius NPCs, hero, Kenney interiors.
 * Runs real Draco/Meshopt/LOD pipeline (not bootstrap copy stubs).
 *
 * Usage:
 *   npm run assets:process-catalog
 *   npm run assets:process-catalog -- --npc albert
 */

import { existsSync, readdirSync, statSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { NPC_QUATERNIUS_MAP } from './quaternius-import.mjs';
import { processGltfAsset } from './lib/gltfProcess.mjs';
import { hasGltfMagic } from './lib/assetDiskPresence.mjs';
import { skipKhronosBootstrap } from './lib/deployEnv.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const SOURCE_NPCS = path.join(ROOT, 'assets-source/ai3dgen/npcs');
const SOURCE_INTERIORS = path.join(ROOT, 'assets-source/ai3dgen/interiors');
const PUBLIC = path.join(ROOT, 'public');

const npcFilterArg = process.argv.indexOf('--npc');
const npcFilter = npcFilterArg >= 0 ? process.argv[npcFilterArg + 1] : null;

function publicBaseFromPrimary(relPath) {
  const withoutExt = relPath.replace(/\.glb$/i, '');
  return path.join(PUBLIC, withoutExt);
}

function resolveOutBase(entry, primaryRel) {
  if (entry.npcId === 'volodka') {
    return path.join(PUBLIC, 'models/characters/volodka/volodka');
  }
  return publicBaseFromPrimary(primaryRel);
}

function processQuaterniusNpcs() {
  let count = 0;
  for (const entry of NPC_QUATERNIUS_MAP) {
    if (npcFilter && entry.npcId !== npcFilter && entry.source !== `${npcFilter}.glb`) {
      continue;
    }
    const src = path.join(SOURCE_NPCS, entry.source);
    if (!existsSync(src)) {
      console.warn(`⚠ Skip ${entry.source} — source missing`);
      continue;
    }

    const primary = entry.publicPaths[0];
    const outBase = resolveOutBase(entry, primary);
    const layout = entry.npcId === 'volodka' ? 'hero-lod' : 'npc-flat';

    console.log(`\n── ${entry.npcId ?? 'hero'} (${entry.source}) ──`);
    processGltfAsset({
      root: ROOT,
      srcPath: src,
      outBase,
      layout,
      exitOnFail: true,
    });
    count += 1;
  }
  return count;
}

function processInteriors() {
  if (!existsSync(SOURCE_INTERIORS)) return 0;
  let count = 0;
  for (const entry of readdirSync(SOURCE_INTERIORS)) {
    if (!entry.endsWith('.glb')) continue;
    const src = path.join(SOURCE_INTERIORS, entry);
    const outBase = path.join(PUBLIC, 'models/interiors', entry.replace(/\.glb$/i, ''));
    console.log(`\n── interior ${entry} ──`);
    processGltfAsset({
      root: ROOT,
      srcPath: src,
      outBase,
      layout: 'single',
      skipLod: true,
      exitOnFail: true,
    });
    count += 1;
  }
  return count;
}

function processEnvironmentStubs() {
  const outLod0 = path.join(PUBLIC, 'models/environments/cafe/props_lod0.glb');
  if (existsSync(outLod0) && hasGltfMagic(outLod0)) {
    console.log('\n⊘ skip env_cafe_props (output already on disk)');
    return 0;
  }
  if (skipKhronosBootstrap()) {
    console.log('\n⊘ skip env_cafe_props (Khronos bootstrap disabled on CI/Vercel)');
    return 0;
  }
  const cafeSrc = path.join(ROOT, 'public/models/khronos/BrainStem.glb');
  if (!existsSync(cafeSrc)) return 0;
  const outBase = path.join(PUBLIC, 'models/environments/cafe/props');
  console.log('\n── env_cafe_props (Khronos interim) ──');
  processGltfAsset({
    root: ROOT,
    srcPath: cafeSrc,
    outBase,
    layout: 'suffix-lod',
    exitOnFail: true,
  });
  return 1;
}

function processVegetationStub() {
  const outLod0 = path.join(PUBLIC, 'models/vegetation/pine/pine_lod0.glb');
  if (existsSync(outLod0) && hasGltfMagic(outLod0)) {
    console.log('\n⊘ skip veg_tree_pine (output already on disk)');
    return 0;
  }
  if (skipKhronosBootstrap()) {
    console.log('\n⊘ skip veg_tree_pine (Khronos bootstrap disabled on CI/Vercel)');
    return 0;
  }
  const pineSrc = path.join(ROOT, 'public/models/khronos/Avocado.glb');
  if (!existsSync(pineSrc)) return 0;
  const outBase = path.join(PUBLIC, 'models/vegetation/pine/pine');
  console.log('\n── veg_tree_pine (Khronos interim) ──');
  processGltfAsset({
    root: ROOT,
    srcPath: pineSrc,
    outBase,
    layout: 'suffix-lod',
    exitOnFail: true,
  });
  return 1;
}

const npcCount = processQuaterniusNpcs();
const interiorCount = npcFilter ? 0 : processInteriors();
const envCount = npcFilter ? 0 : processEnvironmentStubs();
const vegCount = npcFilter ? 0 : processVegetationStub();

console.log(
  `\n✓ Catalog processing complete (${npcCount} NPC(s), ${interiorCount} interior(s), ${envCount + vegCount} env/veg).`,
);
console.log('  Next: npm run assets:sync-shipped && npm run assets:validate');
