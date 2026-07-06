#!/usr/bin/env node
/**
 * [KTX2] Batch convert all base GLBs to KTX2 textures + meshopt geometry.
 *
 * Pipeline per GLB:
 * 1. etc1s (textures → KTX2/ETC1S via Basis Universal)
 * 2. meshopt (geometry → EXT_meshopt_compression)
 *
 * Skips: *.draco.glb, *.meshopt.glb, *_lod1.glb, *_lod2.glb (already compressed/LOD)
 * In-place replacement: output overwrites input.
 *
 * Prerequisites: KTX-Software (ktx binary) must be on PATH.
 * Install: https://github.com/KhronosGroup/KTX-Software/releases
 *
 * Usage:
 *   PATH=/path/to/ktx/bin:$PATH node scripts/convert-ktx2.mjs
 *   PATH=/path/to/ktx/bin:$PATH node scripts/convert-ktx2.mjs --dry-run
 */

import { readdirSync, statSync, existsSync, renameSync, unlinkSync } from 'node:fs';
import { join, dirname, basename } from 'node:path';
import { execSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');
const PUBLIC = join(ROOT, 'public', 'models');

const DRY_RUN = process.argv.includes('--dry-run');
const VERBOSE = process.argv.includes('--verbose');

function findGlbs(dir) {
  const results = [];
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) {
      results.push(...findGlbs(full));
    } else if (entry.name.endsWith('.glb')) {
      // Skip already-compressed variants
      if (entry.name.endsWith('.draco.glb')) continue;
      if (entry.name.endsWith('.meshopt.glb')) continue;
      // Skip LOD variants (they're copies with fewer tris, not different textures)
      if (entry.name.match(/_lod[12]\.glb$/)) continue;
      results.push(full);
    }
  }
  return results;
}

function formatBytes(bytes) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function convertGlb(filepath) {
  const originalSize = statSync(filepath).size;
  const tmp1 = filepath + '.ktx2_tmp';
  const tmp2 = filepath + '.meshopt_tmp';

  try {
    // Step 1: ETC1S texture compression (PNG/JPG → KTX2)
    execSync(`npx gltf-transform etc1s "${filepath}" "${tmp1}" --quality 200`, {
      stdio: VERBOSE ? 'inherit' : 'pipe',
      cwd: ROOT,
      env: { ...process.env },
    });

    // Step 2: Meshopt geometry compression
    execSync(`npx gltf-transform meshopt "${tmp1}" "${tmp2}"`, {
      stdio: VERBOSE ? 'inherit' : 'pipe',
      cwd: ROOT,
      env: { ...process.env },
    });

    const convertedSize = statSync(tmp2).size;
    const reduction = ((1 - convertedSize / originalSize) * 100).toFixed(0);

    if (!DRY_RUN) {
      // Replace original
      renameSync(tmp2, filepath);
    }

    // Cleanup
    if (existsSync(tmp1)) unlinkSync(tmp1);

    return { originalSize, convertedSize, reduction };
  } catch (err) {
    // Cleanup on failure
    if (existsSync(tmp1)) unlinkSync(tmp1);
    if (existsSync(tmp2)) unlinkSync(tmp2);
    throw err;
  }
}

// Main
const glbs = findGlbs(PUBLIC);
console.log(`\n[KTX2] Found ${glbs.length} base GLBs to convert${DRY_RUN ? ' (DRY RUN)' : ''}\n`);

let totalOriginal = 0;
let totalConverted = 0;
let success = 0;
let failed = 0;

for (let i = 0; i < glbs.length; i++) {
  const glb = glbs[i];
  const rel = glb.replace(ROOT + '/', '');
  const origSize = statSync(glb).size;
  totalOriginal += origSize;

  try {
    if (DRY_RUN) {
      console.log(`  [${i + 1}/${glbs.length}] ${rel} — ${formatBytes(origSize)} (skip)`);
      totalConverted += origSize;
      success++;
      continue;
    }

    const result = convertGlb(glb);
    totalConverted += result.convertedSize;
    success++;

    const arrow = result.reduction > 0 ? '↓' : '↑';
    console.log(
      `  [${i + 1}/${glbs.length}] ${rel} — ${formatBytes(origSize)} → ${formatBytes(result.convertedSize)} (${arrow}${Math.abs(result.reduction)}%)`,
    );
  } catch (err) {
    failed++;
    totalConverted += origSize;
    console.error(`  [${i + 1}/${glbs.length}] ${rel} — FAILED: ${err.message}`);
  }
}

const totalReduction = ((1 - totalConverted / totalOriginal) * 100).toFixed(0);
console.log(`\n[KTX2] Done: ${success} converted, ${failed} failed`);
console.log(`[KTX2] Total: ${formatBytes(totalOriginal)} → ${formatBytes(totalConverted)} (↓${totalReduction}%)\n`);
