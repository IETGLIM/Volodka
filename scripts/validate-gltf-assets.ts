/**
 * Verify GLB assets referenced by the game exist on disk and look valid.
 *
 * Checks:
 *  1. ASSET_MANIFEST entries with `shipped: true` — full LOD/variant/impostor/lightmap set.
 *     Unshipped assets are skipped (runtime skips them too) and reported as info.
 *  2. Runtime registries that load eagerly per scene: PROP_MODEL_REGISTRY,
 *     NPC_MODEL_ASSETS, first-person arms, MODEL_URLS (public/models/khronos).
 *     Files must exist AND start with the binary glTF magic — catches
 *     "404: Not Found" HTML/text stubs saved as .glb.
 *
 * Usage: npx tsx scripts/validate-gltf-assets.ts [--warn-only]
 */

import { existsSync, openSync, readSync, closeSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { ASSET_MANIFEST } from '../src/config/assetManifest';
import { getPropModelUrls } from '../src/config/propModelRegistry';
import { getNpcModelUrls } from '../src/config/npcModelRegistry';
import { getAi3dgenPublicUrls } from '../src/config/ai3dgenAssetCatalog';
import { MODEL_URLS } from '../src/config/modelUrls';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const PUBLIC = path.join(ROOT, 'public');
const warnOnly = process.argv.includes('--warn-only');

const FPS_ARMS_URL = '/models/fps/fps_arms.glb';

function publicPath(url: string): string | null {
  if (!url.startsWith('/')) return null;
  return path.join(PUBLIC, url.replace(/^\//, ''));
}

/** Binary glTF magic = ASCII "glTF". Text GLTF (JSON) starts with "{". */
function hasGltfMagic(file: string): boolean {
  const buf = Buffer.alloc(4);
  const fd = openSync(file, 'r');
  try {
    readSync(fd, buf, 0, 4, 0);
  } finally {
    closeSync(fd);
  }
  const head = buf.toString('ascii');
  return head === 'glTF' || head.trimStart().startsWith('{');
}

const missing: Array<{ label: string; url: string; file: string }> = [];
const corrupt: Array<{ label: string; url: string; file: string }> = [];
const skippedManifest: string[] = [];

function checkFile(label: string, url: string, requireMagic: boolean): void {
  const file = publicPath(url);
  if (!file) return;
  if (!existsSync(file)) {
    missing.push({ label, url, file });
    return;
  }
  if (requireMagic && url.toLowerCase().endsWith('.glb') && !hasGltfMagic(file)) {
    corrupt.push({ label, url, file });
  }
}

/* ── 1. Manifest (shipped only) ── */
for (const [id, asset] of Object.entries(ASSET_MANIFEST)) {
  if (asset.shipped !== true) {
    skippedManifest.push(id);
    continue;
  }
  for (const lod of asset.lods) checkFile(`${id} lod`, lod.url, true);
  if (asset.variants) {
    for (const [kind, url] of Object.entries(asset.variants)) {
      if (url) checkFile(`${id} variant:${kind}`, url, true);
    }
  }
  if (asset.impostor?.url) checkFile(`${id} impostor`, asset.impostor.url, false);
  if (asset.bakedLightmap) checkFile(`${id} lightmap`, asset.bakedLightmap, false);
}

/* ── 2. Runtime-loaded GLBs ── */
for (const url of getPropModelUrls()) checkFile('prop', url, true);
for (const url of getNpcModelUrls()) checkFile('npc', url, true);
checkFile('fps-arms', FPS_ARMS_URL, true);
for (const [key, url] of Object.entries(MODEL_URLS)) {
  checkFile(`model-urls:${key}`, url, true);
}

/* ── 3. AI3DGen catalog (validate only when file already imported) ── */
let ai3dgenPending = 0;
for (const url of getAi3dgenPublicUrls()) {
  const file = publicPath(url);
  if (file && existsSync(file)) {
    checkFile('ai3dgen', url, true);
  } else {
    ai3dgenPending += 1;
  }
}

/* ── Report ── */
if (ai3dgenPending > 0) {
  console.log(`ℹ AI3DGen catalog: ${ai3dgenPending} model(s) not imported yet (see assets-source/ai3dgen/README.md)`);
}
if (skippedManifest.length > 0) {
  console.log(`ℹ Skipped unshipped manifest assets: ${skippedManifest.join(', ')}`);
}

if (missing.length === 0 && corrupt.length === 0) {
  console.log('✓ All shipped manifest assets and runtime GLB registries resolved on disk.');
  process.exit(0);
}

if (missing.length > 0) {
  console.error(`✗ Missing ${missing.length} asset file(s):`);
  for (const m of missing) {
    console.error(`  - ${m.label}: ${m.url} (expected ${path.relative(ROOT, m.file)})`);
  }
}
if (corrupt.length > 0) {
  console.error(`✗ Corrupt ${corrupt.length} GLB file(s) (no glTF magic — likely saved error page):`);
  for (const c of corrupt) {
    console.error(`  - ${c.label}: ${c.url} (${path.relative(ROOT, c.file)})`);
  }
}

if (warnOnly) {
  console.warn('Continuing with --warn-only');
  process.exit(0);
}

process.exit(1);
