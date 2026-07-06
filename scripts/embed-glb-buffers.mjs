#!/usr/bin/env node
/**
 * [KTX2] Re-embed external .bin buffers into GLB files.
 *
 * gltf-transform CLI etc1s+meshopt creates external .bin sidecars.
 * This script reads the GLB (which pulls in the .bin), clears all buffer URIs,
 * and writes back as a single embedded GLB.
 *
 * Usage: node scripts/embed-glb-buffers.mjs
 */

import { readdirSync, statSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const { NodeIO } = await import('@gltf-transform/core');
const io = new NodeIO();

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');
const PUBLIC = join(ROOT, 'public', 'models');

function findGlbs(dir) {
  const results = [];
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) results.push(...findGlbs(full));
    else if (entry.name.endsWith('.glb') &&
             !entry.name.endsWith('.draco.glb') &&
             !entry.name.endsWith('.meshopt.glb') &&
             !entry.name.match(/_lod[12]\.glb$/)) {
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

const glbs = findGlbs(PUBLIC);
console.log(`[embed] Checking ${glbs.length} GLBs for external buffer references\n`);

let embedded = 0;
let skipped = 0;
let failed = 0;

for (let i = 0; i < glbs.length; i++) {
  const glb = glbs[i];
  const rel = glb.replace(ROOT + '/', '');
  const binSidecar = glb + '.bin';

  if (!existsSync(binSidecar)) {
    skipped++;
    continue;
  }

  try {
    const beforeSize = statSync(glb).size + statSync(binSidecar).size;

    // Read GLB (gltf-transform will pull in the .bin sidecar automatically)
    const doc = io.read(glb);

    // Clear all buffer URIs → forces embedded write
    for (const buffer of doc.getRoot().listBuffers()) {
      buffer.setURI(null);
    }

    // Write back as embedded GLB
    io.write(glb, doc);

    // Delete the now-unnecessary .bin sidecar
    const { unlinkSync } = await import('node:fs');
    unlinkSync(binSidecar);

    const afterSize = statSync(glb).size;
    embedded++;
    console.log(`  [${i + 1}/${glbs.length}] ${rel} — ${formatBytes(beforeSize)} → ${formatBytes(afterSize)} (embedded)`);
  } catch (err) {
    failed++;
    console.error(`  [${i + 1}/${glbs.length}] ${rel} — FAILED: ${err.message}`);
  }
}

console.log(`\n[embed] Done: ${embedded} embedded, ${skipped} skipped, ${failed} failed`);
