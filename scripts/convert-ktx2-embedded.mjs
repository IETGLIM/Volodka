#!/usr/bin/env node
/**
 * [KTX2] Convert GLBs to KTX2 textures + meshopt geometry with EMBEDDED buffers.
 *
 * Uses gltf-transform API (not CLI) to ensure all data stays embedded in the GLB.
 * CLI's etc1s + meshopt creates external .bin sidecars — API gives control.
 *
 * Prerequisites: KTX-Software (ktx binary) must be on PATH.
 *
 * Usage:
 *   PATH=/path/to/ktx/bin:$PATH node scripts/convert-ktx2-embedded.mjs
 */

import { readdirSync, statSync, existsSync, unlinkSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { platform } from 'node:os';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');
const PUBLIC = join(ROOT, 'public', 'models');

// Dynamic import of gltf-transform (ESM)
const { read, write, Document } = await import('@gltf-transform/core');
const { etc1s, uastc } = await import('@gltf-transform/functions');
const { meshopt } = await import('@gltf-transform/meshopt');

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

  // Read GLB
  const doc = await read(filepath);

  // Step 1: ETC1S texture compression (PNG/JPG → KTX2)
  await doc.transform(
    etc1s({
      slots: {
        // Skip normal maps (use UASTC for those in a future iteration)
        // For now, ETC1S for all — acceptable quality for web RPG
      },
      quality: 200,
    }),
  );

  // Step 2: Meshopt geometry compression
  await doc.transform(meshopt());

  // Step 3: Force all buffers to be embedded (no external .bin files)
  // Clear all buffer URIs so they get embedded in the GLB binary chunk
  for (const buffer of doc.getRoot().listBuffers()) {
    buffer.setURI(null);
  }

  // Write as GLB (embedded)
  await write(filepath, doc, { format: 'glb' });

  const convertedSize = statSync(filepath).size;
  const reduction = ((1 - convertedSize / originalSize) * 100).toFixed(0);
  return { originalSize, convertedSize, reduction };
}

// Clean up any leftover .bin sidecars from previous CLI conversion
function cleanBinSidecars() {
  const sidecars = [];
  function walk(dir) {
    for (const entry of readdirSync(dir, { withFileTypes: true })) {
      const full = join(dir, entry.name);
      if (entry.isDirectory()) walk(full);
      else if (entry.name.endsWith('.glb.bin')) {
        sidecars.push(full);
        unlinkSync(full);
      }
    }
  }
  walk(PUBLIC);
  return sidecars.length;
}

// Main
const cleaned = cleanBinSidecars();
if (cleaned > 0) console.log(`[KTX2] Cleaned ${cleaned} .bin sidecar files\n`);

const glbs = findGlbs(PUBLIC);
console.log(`[KTX2] Converting ${glbs.length} GLBs (embedded buffers)\n`);

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
    console.log(
      `  [${i + 1}/${glbs.length}] ${rel} — ${formatBytes(result.originalSize)} → ${formatBytes(result.convertedSize)} (${arrow}${Math.abs(result.reduction)}%)`,
    );
  } catch (err) {
    failed++;
    totalOriginal += statSync(glb).size;
    totalConverted += statSync(glb).size;
    console.error(`  [${i + 1}/${glbs.length}] ${rel} — FAILED: ${err.message}`);
  }
}

const totalReduction = ((1 - totalConverted / totalOriginal) * 100).toFixed(0);
console.log(`\n[KTX2] Done: ${success} converted, ${failed} failed`);
console.log(`[KTX2] Total: ${formatBytes(totalOriginal)} → ${formatBytes(totalConverted)} (↓${totalReduction}%)`);
