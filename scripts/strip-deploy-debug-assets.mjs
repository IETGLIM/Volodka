#!/usr/bin/env node
/**
 * Remove bootstrap/debug assets from dist/ after vite build.
 *
 * Vite copies all of public/ into dist/, including Khronos reference GLBs
 * (~58MB) used only by assets:bootstrap / catalog stubs. .vercelignore keeps
 * them out of the source upload, but bootstrap may re-download during CI —
 * this strip ensures they never ship in the deploy output.
 */
import { existsSync, rmSync, readdirSync, statSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const DIST = path.join(ROOT, 'dist');

const STRIP_DIRS = ['models/khronos'];

function dirSizeBytes(dir) {
  let total = 0;
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) total += dirSizeBytes(full);
    else total += statSync(full).size;
  }
  return total;
}

if (!existsSync(DIST)) {
  console.warn('⚠ strip-deploy-debug-assets: dist/ missing — skip');
  process.exit(0);
}

let stripped = 0;
for (const rel of STRIP_DIRS) {
  const target = path.join(DIST, rel);
  if (!existsSync(target)) continue;
  const mb = (dirSizeBytes(target) / (1024 * 1024)).toFixed(1);
  rmSync(target, { recursive: true, force: true });
  console.log(`⊘ stripped dist/${rel} (${mb} MB)`);
  stripped += 1;
}

if (stripped === 0) {
  console.log('✓ strip-deploy-debug-assets: nothing to remove');
}
