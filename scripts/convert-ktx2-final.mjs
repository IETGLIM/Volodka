#!/usr/bin/env node
/**
 * [KTX2] Two-pass converter: CLI etc1s+meshopt → API re-embed.
 *
 * Pass 1: CLI `gltf-transform etc1s` + `gltf-transform meshopt` (creates KTX2
 *         textures + meshopt geometry, but may create external .bin sidecars)
 * Pass 2: API `NodeIO` re-reads GLB (pulls in .bin), clears buffer URIs,
 *         writes back as single embedded GLB
 *
 * Prerequisites: KTX-Software (ktx binary) must be on PATH.
 *
 * Usage:
 *   PATH=/path/to/ktx/bin:$PATH node scripts/convert-ktx2-final.mjs
 *   PATH=/path/to/ktx/bin:$PATH node scripts/convert-ktx2-final.mjs --filter props
 */

import { readdirSync, statSync, existsSync, unlinkSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { execSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

// gltf-transform API for re-embedding
const { NodeIO } = await import('@gltf-transform/core');
const {
  EXTMeshoptCompression,
  KHRTextureBasisu,
  KHRLightsPunctual,
  KHRMaterialsUnlit,
  KHRTextureTransform,
  KHRMeshQuantization,
  KHRMaterialsPBRSpecularGlossiness,
} = await import('@gltf-transform/extensions');
// MeshoptDecoder + Encoder from CLI's meshoptimizer package (WASM-based, Node.js compatible)
const meshoptimizerPath = join(process.cwd(), 'node_modules/@gltf-transform/cli/node_modules/meshoptimizer');
const { MeshoptDecoder } = await import('file://' + meshoptimizerPath + '/meshopt_decoder.mjs');
const { MeshoptEncoder } = await import('file://' + meshoptimizerPath + '/meshopt_encoder.js');
// Wait for WASM to be ready
await MeshoptDecoder.ready;
await MeshoptEncoder.ready;

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');
const PUBLIC = join(ROOT, 'public', 'models');
const FILTER = process.argv.includes('--filter') ? process.argv[process.argv.indexOf('--filter') + 1] : null;

const io = new NodeIO()
  .registerExtensions([
    KHRMeshQuantization,
    EXTMeshoptCompression,
    KHRTextureBasisu,
    KHRLightsPunctual,
    KHRMaterialsUnlit,
    KHRTextureTransform,
    KHRMaterialsPBRSpecularGlossiness,
  ])
  .registerDependencies({ 'meshopt.decoder': MeshoptDecoder, 'meshopt.encoder': MeshoptEncoder });

function findGlbs(dir) {
  const results = [];
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) results.push(...findGlbs(full));
    else if (entry.name.endsWith('.glb') &&
             !entry.name.endsWith('.draco.glb') &&
             !entry.name.endsWith('.meshopt.glb') &&
             !entry.name.match(/_lod[12]\.glb$/)) {
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

async function convertAndEmbed(filepath) {
  const binSidecar = filepath + '.bin';
  const hadSidecarBefore = existsSync(binSidecar);
  const originalSize = statSync(filepath).size + (hadSidecarBefore ? statSync(binSidecar).size : 0);
  // Write intermediate files to /tmp to avoid .bin sidecar creation in public/
  const { mkdirSync, copyFileSync } = await import('node:fs');
  const tmpDir = '/tmp/ktx2-convert';
  mkdirSync(tmpDir, { recursive: true });
  const baseName = filepath.split('/').pop();
  const tmp1 = join(tmpDir, baseName + '.etc1s');
  const tmp2 = join(tmpDir, baseName + '.meshopt');

  try {
    // Pass 1a: CLI etc1s (textures → KTX2) — output to /tmp (no .bin sidecars)
    execSync(`npx gltf-transform etc1s "${filepath}" "${tmp1}" --quality 200`, {
      stdio: 'pipe',
      cwd: ROOT,
    });

    // Pass 1b: CLI meshopt (geometry → EXT_meshopt_compression) — output to /tmp
    execSync(`npx gltf-transform meshopt "${tmp1}" "${tmp2}"`, {
      stdio: 'pipe',
      cwd: ROOT,
    });

    // Pass 2: API re-embed (read from /tmp, clear URIs, write to original path)
    const doc = await io.read(tmp2);
    const root = doc.getRoot();

    // Clear all buffer URIs → forces embedded write
    for (const buffer of root.listBuffers()) {
      buffer.setURI(null);
    }

    // Write as embedded GLB to original location
    io.write(filepath, doc);

    // Delete .bin sidecar if it exists (from previous runs)
    if (existsSync(binSidecar)) {
      unlinkSync(binSidecar);
    }

    const convertedSize = statSync(filepath).size;
    const reduction = ((1 - convertedSize / originalSize) * 100).toFixed(0);
    return { originalSize, convertedSize, reduction };
  } finally {
    // Cleanup temp files + any .bin sidecars in /tmp
    if (existsSync(tmp1)) unlinkSync(tmp1);
    if (existsSync(tmp2)) unlinkSync(tmp2);
    if (existsSync(tmp1 + '.bin')) unlinkSync(tmp1 + '.bin');
    if (existsSync(tmp2 + '.bin')) unlinkSync(tmp2 + '.bin');
  }
}

// Clean any leftover .bin sidecars from previous runs
function cleanBinSidecars(dir) {
  let cleaned = 0;
  function walk(d) {
    for (const entry of readdirSync(d, { withFileTypes: true })) {
      const full = join(d, entry.name);
      if (entry.isDirectory()) walk(full);
      else if (entry.name.endsWith('.glb.bin')) {
        unlinkSync(full);
        cleaned++;
      }
    }
  }
  walk(dir);
  return cleaned;
}

// Main
const cleaned = cleanBinSidecars(PUBLIC);
if (cleaned > 0) console.log(`[KTX2] Cleaned ${cleaned} leftover .bin sidecars\n`);

const glbs = findGlbs(PUBLIC);
console.log(`[KTX2] Converting ${glbs.length} GLBs (CLI etc1s+meshopt → API re-embed)${FILTER ? ` filter: ${FILTER}` : ''}\n`);

let totalOriginal = 0;
let totalConverted = 0;
let success = 0;
let failed = 0;

for (let i = 0; i < glbs.length; i++) {
  const glb = glbs[i];
  const rel = glb.replace(ROOT + '/', '');

  try {
    const result = await convertAndEmbed(glb);
    totalOriginal += result.originalSize;
    totalConverted += result.convertedSize;
    success++;

    const arrow = result.reduction > 0 ? '↓' : '↑';
    console.log(`  [${i + 1}/${glbs.length}] ${rel} — ${formatBytes(result.originalSize)} → ${formatBytes(result.convertedSize)} (${arrow}${Math.abs(result.reduction)}%)`);
  } catch (err) {
    failed++;
    const origSize = statSync(glb).size;
    totalOriginal += origSize;
    totalConverted += origSize;
    console.error(`  [${i + 1}/${glbs.length}] ${rel} — FAILED: ${err.message}`);
  }
}

const totalReduction = totalOriginal > 0 ? ((1 - totalConverted / totalOriginal) * 100).toFixed(0) : 0;
console.log(`\n[KTX2] Done: ${success} converted, ${failed} failed`);
console.log(`[KTX2] Total: ${formatBytes(totalOriginal)} → ${formatBytes(totalConverted)} (↓${totalReduction}%)`);

// Verify no .bin sidecars remain
const remainingBins = findGlbs(PUBLIC).filter(g => existsSync(g + '.bin'));
if (remainingBins.length > 0) {
  console.warn(`[KTX2] WARNING: ${remainingBins.length} .bin sidecars still exist`);
} else {
  console.log('[KTX2] All GLBs embedded — no external .bin files');
}
