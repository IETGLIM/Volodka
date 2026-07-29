/**
 * Verify GLB assets referenced by the game exist on disk and look valid.
 *
 * Checks:
 *  1. ASSET_MANIFEST entries with `shipped: true` — full LOD/variant/impostor/lightmap set.
 *     Unshipped assets are skipped (runtime skips them too) and reported as info.
 *  2. Runtime registries that load eagerly per scene: PROP_MODEL_REGISTRY,
 *     NPC_MODEL_ASSETS, first-person arms, MODEL_URLS.
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
import { getRpmPublicUrls } from '../src/config/rpmNpcCatalog';
import { RPM_NPC_GLB_URLS_ON_DISK } from '../src/config/rpmNpcOnDisk.generated';
import { MIXAMO_ANIMATION_CATALOG } from '../src/config/mixamoAnimationCatalog';
import { MIXAMO_CLIP_IDS_ON_DISK } from '../src/config/mixamoClipsOnDisk';
import { MODEL_URLS } from '../src/config/modelUrls';
import { FPS_ARMS_URL } from '../src/config/fpsArmsUrl';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const PUBLIC = path.join(ROOT, 'public');
const warnOnly = process.argv.includes('--warn-only');

const { skipKhronosBootstrap } = await import('./lib/deployEnv.mjs');
const khronosExcludedFromDeploy = skipKhronosBootstrap();

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

/* ── 4. RPM NPC catalog (validate only when imported / on disk) ── */
let rpmPending = 0;
const rpmOnDisk = new Set(RPM_NPC_GLB_URLS_ON_DISK);
for (const url of getRpmPublicUrls()) {
  const file = publicPath(url);
  if (rpmOnDisk.has(url) && file && existsSync(file)) {
    checkFile('rpm-npc', url, true);
  } else if (!rpmOnDisk.has(url)) {
    rpmPending += 1;
  }
}

let mixamoPending = 0;
const onDiskMixamo = new Set(MIXAMO_CLIP_IDS_ON_DISK);
for (const spec of MIXAMO_ANIMATION_CATALOG) {
  if (!onDiskMixamo.has(spec.id)) {
    mixamoPending += 1;
    continue;
  }
  const file = publicPath(spec.publicUrl);
  if (file && existsSync(file)) {
    checkFile(`mixamo:${spec.id}`, spec.publicUrl, true);
  } else if (file) {
    missing.push({ label: `mixamo:${spec.id}`, url: spec.publicUrl, file });
  }
}

/* ── 5. LOD size sanity check ── */
const { statSync } = await import('node:fs');
const lodWarnings: string[] = [];
for (const [id, asset] of Object.entries(ASSET_MANIFEST)) {
  if (asset.shipped !== true || asset.lods.length < 2) continue;
  const lod0Path = publicPath(asset.lods[0].url);
  if (!lod0Path || !existsSync(lod0Path)) continue;
  const lod0Size = statSync(lod0Path).size;
  for (const lod of asset.lods.slice(1)) {
    const lodPath = publicPath(lod.url);
    if (!lodPath || !existsSync(lodPath)) continue;
    const lodSize = statSync(lodPath).size;
    // LOD1/LOD2 should be smaller than LOD0 for static meshes;
    // for skinned meshes (category='character'), texture-resize LOD may be
    // similar size — but should still be ≤ 110% of LOD0.
    const threshold = asset.category === 'character' ? 1.1 : 0.9;
    if (lodSize > lod0Size * threshold) {
      const pct = ((lodSize / lod0Size) * 100).toFixed(0);
      lodWarnings.push(`${id} LOD (d=${lod.maxDistance}m): ${lod.url} is ${pct}% of LOD0 size — expected <${(threshold * 100).toFixed(0)}%`);
    }
  }
}

/* ── 6. Khronos reference models in production ── */
const khronosDir = path.join(PUBLIC, 'models', 'khronos');
let khronosSize = 0;
let khronosCount = 0;
if (existsSync(khronosDir)) {
  const { readdirSync } = await import('node:fs');
  for (const entry of readdirSync(khronosDir)) {
    if (entry.endsWith('.glb')) {
      khronosCount += 1;
      khronosSize += statSync(path.join(khronosDir, entry)).size;
    }
  }
}
const khronosMB = (khronosSize / (1024 * 1024)).toFixed(1);

/* ── Report ── */
if (mixamoPending > 0) {
  console.log(`ℹ Mixamo catalog: ${mixamoPending} clip(s) not imported yet (see assets-source/mixamo/README.md)`);
}
if (ai3dgenPending > 0) {
  console.log(`ℹ AI3DGen catalog: ${ai3dgenPending} model(s) not imported yet (see assets-source/ai3dgen/README.md)`);
}
if (rpmPending > 0) {
  console.log(`ℹ RPM NPC catalog: ${rpmPending} avatar(s) pending (see assets-source/ai3dgen/npcs/README.md)`);
}
if (skippedManifest.length > 0) {
  console.log(`ℹ Skipped unshipped manifest assets: ${skippedManifest.join(', ')}`);
}
if (khronosCount > 0 && !khronosExcludedFromDeploy) {
  console.warn(
    `⚠ Khronos reference models on disk: ${khronosCount} files, ${khronosMB}MB — dev-only; excluded from Vercel via .vercelignore`,
  );
}
if (lodWarnings.length > 0) {
  console.warn(`⚠ LOD size warnings (${lodWarnings.length}):`);
  for (const w of lodWarnings) console.warn(`  - ${w}`);
  console.warn('  Run npm run assets:validate-lod for detailed vertex-level analysis');
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
