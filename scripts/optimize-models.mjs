#!/usr/bin/env node
/**
 * Batch GLB optimization for Volodka RPG.
 *
 * Strategy (per model category):
 *  - Static props with textures (server_fragment, digital_amulet, …):
 *    optimize --compress draco --texture-compress webp
 *    → geometry (Draco) + textures (WebP). Huge wins on texture-heavy props.
 *  - Skinned rigs (_rigs/male_*, female_*, fps_arms):
 *    optimize --compress meshopt --texture-compress webp
 *    → Meshopt preserves skinned animation; Draco breaks it.
 *  - Small static props/interiors (bookshelf, desk, terminal, apartment_envelope):
 *    optimize --compress meshopt --texture-compress webp
 *
 * WebP is auto-supported by three.js GLTFLoader (EXT_texture_webp, registered
 * by default — no loader config change needed). Draco + Meshopt decoders are
 * already wired in src/engine/assets/gltfPipeline.ts.
 *
 * Writes optimized files NEXT TO originals with .opt.glb suffix, then we move
 * them over the originals in a second pass (so the game keeps referencing the
 * same /models/.../*.glb URLs — no assetManifest changes required).
 *
 * Skips files that are already compressed (KHR_draco / EXT_meshopt present).
 */
import { execFileSync } from 'node:child_process';
import { existsSync, renameSync, statSync } from 'node:fs';
import path from 'node:path';

const ROOT = path.resolve(import.meta.dirname, '..');
const MODELS = path.join(ROOT, 'public', 'models');
const TMP = '/tmp/volodka-gltf-opt';

const CLI = 'npx';
const CLI_ARGS = ['--yes', '@gltf-transform/cli@latest', 'optimize'];

/** Models to optimize with Draco (static, texture-heavy). */
const DRACO_TARGETS = [
  'props/server_fragment.glb',
  'props/digital_amulet.glb',
  'props/neural_filter.glb',
  'props/encrypted_scroll.glb',
  'props/poetic_compiler.glb',
];

/** Skinned rigs — meshopt only (Draco breaks skinned animation). */
const MESHOPT_TARGETS = [
  'npcs/_rigs/male_01.glb',
  'npcs/_rigs/male_02.glb',
  'npcs/_rigs/male_03.glb',
  'npcs/_rigs/male_04.glb',
  'npcs/_rigs/male_05.glb',
  'npcs/_rigs/male_06.glb',
  'npcs/_rigs/male_07.glb',
  'npcs/_rigs/male_08.glb',
  'npcs/_rigs/male_09.glb',
  'npcs/_rigs/male_10.glb',
  'npcs/_rigs/male_11.glb',
  'npcs/_rigs/female_01.glb',
  'npcs/_rigs/female_02.glb',
  'npcs/_rigs/female_03.glb',
  'npcs/_rigs/female_04.glb',
  'npcs/_rigs/female_05.glb',
  'npcs/_rigs/female_06.glb',
  'npcs/_rigs/female_07.glb',
  'npcs/_rigs/female_08.glb',
  'npcs/_rigs/female_09.glb',
  'fps/fps_arms.glb',
  // small static props + envelope — meshopt is safe and fast
  'interiors/apartment_envelope.glb',
  'props/bookshelf.glb',
  'props/desk.glb',
  'props/terminal.glb',
  'animations/idle.glb',
];

/** Check if a GLB already has Draco or Meshopt compression. */
function isAlreadyCompressed(file) {
  try {
    const out = execFileSync('strings', [file], { encoding: 'utf8', maxBuffer: 64 * 1024 * 1024 });
    return /KHR_draco_mesh_compression|EXT_meshopt_compression/.test(out);
  } catch {
    return false;
  }
}

function runOptimize(rel, compress, textureSize) {
  const src = path.join(MODELS, rel);
  if (!existsSync(src)) {
    console.log(`SKIP (missing): ${rel}`);
    return { rel, skipped: true, reason: 'missing' };
  }
  if (isAlreadyCompressed(src)) {
    console.log(`SKIP (already compressed): ${rel}`);
    return { rel, skipped: true, reason: 'already-compressed' };
  }

  const tmpOut = path.join(TMP, rel.replace(/[\\/]/g, '__') + '.opt.glb');
  const args = [...CLI_ARGS, src, tmpOut, '--compress', compress, '--texture-compress', 'webp', '--texture-size', String(textureSize)];

  const beforeSize = statSync(src).size;
  console.log(`OPTIMIZE (${compress}, webp, ≤${textureSize}px): ${rel} (${(beforeSize / 1024 / 1024).toFixed(2)} MB)`);

  try {
    execFileSync(CLI, args, { stdio: 'inherit', cwd: ROOT });
  } catch (e) {
    console.error(`FAILED: ${rel} — ${e.message}`);
    return { rel, skipped: true, reason: 'optimize-failed' };
  }

  if (!existsSync(tmpOut)) {
    console.error(`FAILED (no output): ${rel}`);
    return { rel, skipped: true, reason: 'no-output' };
  }

  const afterSize = statSync(tmpOut).size;
  const ratio = (beforeSize / afterSize).toFixed(2);
  console.log(`  → ${(afterSize / 1024 / 1024).toFixed(2)} MB (×${ratio} compression)\n`);

  // Move optimized over original
  renameSync(tmpOut, src);
  return { rel, skipped: false, beforeSize, afterSize, ratio };
}

function main() {
  // Ensure tmp dir
  execFileSync('mkdir', ['-p', TMP], { stdio: 'inherit' });

  const results = [];
  console.log('=== Draco targets (static, texture-heavy) ===\n');
  for (const rel of DRACO_TARGETS) {
    results.push(runOptimize(rel, 'draco', 2048));
  }

  console.log('\n=== Meshopt targets (skinned rigs + small static) ===\n');
  for (const rel of MESHOPT_TARGETS) {
    results.push(runOptimize(rel, 'meshopt', 1024));
  }

  // Summary
  const optimized = results.filter((r) => !r.skipped);
  const skipped = results.filter((r) => r.skipped);
  const totalBefore = optimized.reduce((s, r) => s + r.beforeSize, 0);
  const totalAfter = optimized.reduce((s, r) => s + r.afterSize, 0);
  console.log('\n=== SUMMARY ===');
  console.log(`Optimized: ${optimized.length} files`);
  console.log(`Skipped:   ${skipped.length} files`);
  for (const r of skipped) console.log(`  - ${r.rel}: ${r.reason}`);
  console.log(`Total before: ${(totalBefore / 1024 / 1024).toFixed(2)} MB`);
  console.log(`Total after:  ${(totalAfter / 1024 / 1024).toFixed(2)} MB`);
  console.log(`Saved:        ${((totalBefore - totalAfter) / 1024 / 1024).toFixed(2)} MB (${((1 - totalAfter / totalBefore) * 100).toFixed(1)}%)`);
}

main();
