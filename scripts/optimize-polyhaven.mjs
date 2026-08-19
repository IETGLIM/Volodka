#!/usr/bin/env node
/**
 * Convert all Poly Haven .gltf models (external .bin + .jpg textures) into
 * single self-contained .glb files with Draco geometry + WebP textures.
 *
 * Why: Poly Haven ships as .gltf + external .bin + 4-6 JPG textures per model
 * (diff/nor/rough/ao/arm at 1k/2k). That's ~219 MB across 33 models. Inlining
 * + Draco + WebP collapses each to a single .glb at ~5-10% of original size
 * (apartments facade: 48 MB → 1.3 MB, ×37).
 *
 * After conversion:
 *  - Writes <name>.glb next to the original .gltf
 *  - Removes the old .gltf, .bin, and textures/ folder (no longer referenced)
 *  - Updates src/config/polyhavenAssets.ts POLYHAVEN_MODELS entries
 *    (.gltf → .glb) so the loader fetches the optimized single-file asset
 *
 * Loader support: GLTFLoader auto-registers EXT_texture_webp and the Draco/
 * Meshopt decoders are wired in src/engine/assets/gltfPipeline.ts. No runtime
 * changes needed beyond the URL swap.
 */
import { execFileSync } from 'node:child_process';
import { existsSync, rmSync, statSync, readdirSync, renameSync, readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';

const ROOT = path.resolve(import.meta.dirname, '..');
const POLYHAVEN = path.join(ROOT, 'public', 'models', 'polyhaven');
const TMP = '/tmp/volodka-polyhaven-opt';
const ASSETS_TS = path.join(ROOT, 'src', 'config', 'polyhavenAssets.ts');

const TEXTURE_SIZE = 1024; // Poly Haven props are small scene dressing — 1k is plenty

function run(cmd, args, opts = {}) {
  execFileSync(cmd, args, { stdio: opts.silent ? 'pipe' : 'inherit', cwd: ROOT, ...opts });
}

function optimizeOne(gltfPath) {
  const dir = path.dirname(gltfPath);
  const base = path.basename(gltfPath, '.gltf');
  const glbOut = path.join(dir, base + '.glb');
  const tmpOut = path.join(TMP, base.replace(/[\\/]/g, '__') + '.glb');

  const beforeFiles = [gltfPath, path.join(dir, base + '.bin'), path.join(dir, 'textures')];
  let beforeSize = 0;
  for (const p of beforeFiles) {
    if (existsSync(p)) {
      const st = statSync(p);
      beforeSize += st.isDirectory() ? dirSize(p) : st.size;
    }
  }

  console.log(`OPTIMIZE: ${path.relative(POLYHAVEN, gltfPath)} (${(beforeSize / 1024 / 1024).toFixed(2)} MB)`);

  try {
    run('npx', [
      '--yes', '@gltf-transform/cli@latest', 'optimize',
      gltfPath, tmpOut,
      '--compress', 'draco',
      '--texture-compress', 'webp',
      '--texture-size', String(TEXTURE_SIZE),
    ], { silent: true });
  } catch (e) {
    console.error(`  FAILED: ${e.message}`);
    return null;
  }

  if (!existsSync(tmpOut)) {
    console.error('  FAILED: no output');
    return null;
  }

  const afterSize = statSync(tmpOut).size;
  const ratio = (beforeSize / afterSize).toFixed(1);
  console.log(`  → ${(afterSize / 1024 / 1024).toFixed(2)} MB (×${ratio})`);

  // Move optimized glb into place
  renameSync(tmpOut, glbOut);

  // Remove old .gltf, .bin, textures/
  rmSync(gltfPath, { force: true });
  rmSync(path.join(dir, base + '.bin'), { force: true });
  rmSync(path.join(dir, 'textures'), { recursive: true, force: true });

  return { beforeSize, afterSize, ratio };
}

function dirSize(p) {
  let total = 0;
  for (const entry of readdirSync(p, { withFileTypes: true })) {
    const full = path.join(p, entry.name);
    total += entry.isDirectory() ? dirSize(full) : statSync(full).size;
  }
  return total;
}

function updateAssetsTs() {
  // Replace all .gltf references in POLYHAVEN_MODELS with .glb
  let src = readFileSync(ASSETS_TS, 'utf8');
  const before = src;
  // Only replace within the POLYHAVEN_MODELS block (lines starting with
  // key: '/models/polyhaven/.../*.gltf',) — safer than a global replace.
  src = src.replace(
    /(\/models\/polyhaven\/[^'"]+)\.gltf'/g,
    "$1.glb'",
  );
  if (src === before) {
    console.log('polyhavenAssets.ts: no .gltf references found to update');
    return 0;
  }
  writeFileSync(ASSETS_TS, src, 'utf8');
  const count = (before.match(/\.gltf'/g) || []).length - (src.match(/\.gltf'/g) || []).length;
  console.log(`polyhavenAssets.ts: updated ${count} .gltf → .glb references`);
  return count;
}

function main() {
  run('mkdir', ['-p', TMP], { silent: true });

  const gltfFiles = [];
  function walk(d) {
    for (const e of readdirSync(d, { withFileTypes: true })) {
      const full = path.join(d, e.name);
      if (e.isDirectory()) walk(full);
      else if (e.name.endsWith('.gltf')) gltfFiles.push(full);
    }
  }
  walk(POLYHAVEN);

  console.log(`Found ${gltfFiles.length} Poly Haven .gltf models\n`);

  let totalBefore = 0, totalAfter = 0, count = 0;
  for (const gltf of gltfFiles) {
    const r = optimizeOne(gltf);
    if (r) {
      totalBefore += r.beforeSize;
      totalAfter += r.afterSize;
      count++;
    }
  }

  console.log('\n=== POLYHAVEN SUMMARY ===');
  console.log(`Optimized: ${count}/${gltfFiles.length} models`);
  console.log(`Total before: ${(totalBefore / 1024 / 1024).toFixed(2)} MB`);
  console.log(`Total after:  ${(totalAfter / 1024 / 1024).toFixed(2)} MB`);
  console.log(`Saved:        ${((totalBefore - totalAfter) / 1024 / 1024).toFixed(2)} MB (${((1 - totalAfter / totalBefore) * 100).toFixed(1)}%)`);

  console.log('\n=== Updating polyhavenAssets.ts ===');
  updateAssetsTs();

  // Clean tmp
  rmSync(TMP, { recursive: true, force: true });
}

main();
