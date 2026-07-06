#!/usr/bin/env node
/**
 * [KTX2] Convert GLBs to KTX2 textures + meshopt geometry with EMBEDDED buffers.
 *
 * Uses gltf-transform API (NodeIO) with extension registration to:
 * 1. Read GLB (decodes existing meshopt/draco, pulls in .bin sidecars if any)
 * 2. Apply ETC1S texture compression (PNG/JPG → KTX2 via Basis Universal)
 * 3. Apply meshopt geometry compression (EXT_meshopt_compression)
 * 4. Clear all buffer URIs → forces embedded GLB binary chunk
 * 5. Write as single embedded GLB (no external .bin files)
 *
 * Prerequisites: KTX-Software (ktx binary) must be on PATH.
 *
 * Usage:
 *   PATH=/path/to/ktx/bin:$PATH node scripts/convert-ktx2-api.mjs
 *   PATH=/path/to/ktx/bin:$PATH node scripts/convert-ktx2-api.mjs --filter props
 */

import { readdirSync, statSync, existsSync, unlinkSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

// gltf-transform API imports
const { NodeIO } = await import('@gltf-transform/core');
const { etc1s, meshopt, prune, dedup } = await import('@gltf-transform/functions');
const {
  EXTMeshoptCompression,
  KHRTextureBasisu,
  KHRLightsPunctual,
  KHRMaterialsUnlit,
  KHRTextureTransform,
} = await import('@gltf-transform/extensions');

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');
const PUBLIC = join(ROOT, 'public', 'models');

const FILTER = process.argv.includes('--filter') ? process.argv[process.argv.indexOf('--filter') + 1] : null;

// Create NodeIO with all required extensions for reading/writing
const io = new NodeIO()
  .registerExtensions([
    EXTMeshoptCompression,
    KHRTextureBasisu,
    KHRLightsPunctual,
    KHRMaterialsUnlit,
    KHRTextureTransform,
  ]);

function findGlbs(dir) {
  const results = [];
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) {
      results.push(...findGlbs(full));
    } else if (entry.name.endsWith('.glb')) {
      if (entry.name.endsWith('.draco.glb')) continue;
      if (entry.name.endsWith('.meshopt.glb')) continue;
      if (entry.name.match(/_lod[12]\.glb$/)) continue;
      if (FILTER && !full.includes(FILTER)) continue;
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

async function convertGlb(filepath) {
  const originalSize = statSync(filepath).size;
  const binSidecar = filepath + '.bin';
  const hadSidecar = existsSync(binSidecar);
  const totalOriginalSize = originalSize + (hadSidecar ? statSync(binSidecar).size : 0);

  // Read GLB (NodeIO resolves .bin sidecars automatically via filesystem)
  const doc = io.read(filepath);

  // Step 1: Deduplicate accessors and textures (cleanup before compression)
  await doc.transform(dedup());

  // Step 2: ETC1S texture compression (PNG/JPG → KTX2)
  // Note: etc1s requires ktx binary on PATH
  await doc.transform(etc1s({ quality: 200 }));

  // Step 3: Meshopt geometry compression
  await doc.transform(meshopt());

  // Step 4: Prune unused data (skeletons, accessors from dedup)
  await doc.transform(prune());

  // Step 5: Force all buffers to be embedded (clear URIs)
  for (const buffer of doc.getRoot().listBuffers()) {
    buffer.setURI(null);
  }

  // Write as embedded GLB
  io.write(filepath, doc);

  // Delete .bin sidecar if it existed
  if (hadSidecar && existsSync(binSidecar)) {
    unlinkSync(binSidecar);
  }

  const convertedSize = statSync(filepath).size;
  const reduction = ((1 - convertedSize / totalOriginalSize) * 100).toFixed(0);
  return { originalSize: totalOriginalSize, convertedSize, reduction, hadSidecar };
}

// Main
const glbs = findGlbs(PUBLIC);
console.log(`\n[KTX2-API] Converting ${glbs.length} GLBs (embedded buffers)${FILTER ? ` filter: ${FILTER}` : ''}\n`);

let totalOriginal = 0;
let totalConverted = 0;
let success = 0;
let failed = 0;

for (let i = 0; i < glbs.length; i++) {
  const glb = glbs[i];
  const rel = glb.replace(ROOT + '/', '');

  try {
    const result = await convertGlb(glb);
    totalOriginal += result.originalSize;
    totalConverted += result.convertedSize;
    success++;

    const arrow = result.reduction > 0 ? '↓' : '↑';
    const sidecarNote = result.hadSidecar ? ' (+.bin)' : '';
    console.log(
      `  [${i + 1}/${glbs.length}] ${rel} — ${formatBytes(result.originalSize)}${sidecarNote} → ${formatBytes(result.convertedSize)} (${arrow}${Math.abs(result.reduction)}%)`,
    );
  } catch (err) {
    failed++;
    const origSize = statSync(glb).size;
    totalOriginal += origSize;
    totalConverted += origSize;
    console.error(`  [${i + 1}/${glbs.length}] ${rel} — FAILED: ${err.message}`);
  }
}

const totalReduction = totalOriginal > 0 ? ((1 - totalConverted / totalOriginal) * 100).toFixed(0) : 0;
console.log(`\n[KTX2-API] Done: ${success} converted, ${failed} failed`);
console.log(`[KTX2-API] Total: ${formatBytes(totalOriginal)} → ${formatBytes(totalConverted)} (↓${totalReduction}%)\n`);
