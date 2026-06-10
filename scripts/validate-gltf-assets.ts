/**
 * Verify ASSET_MANIFEST paths exist on disk (LOD + compression variants).
 * Also checks CC0 placeholder GLBs referenced by modelUrls.ts.
 *
 * Run after `npm run assets:process` or in CI when models are checked in.
 *
 * Usage: npx tsx scripts/validate-gltf-assets.ts [--warn-only]
 */

import { existsSync, statSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { ASSET_MANIFEST } from '../src/config/assetManifest';
import { LOCAL_MODEL_PATHS } from '../src/config/modelUrls';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const PUBLIC = path.join(ROOT, 'public');
const warnOnly = process.argv.includes('--warn-only');

/** Warn when a single GLB exceeds this size (uncompressed CC0 placeholders may be smaller). */
const GLB_SIZE_WARN_BYTES = 8 * 1024 * 1024;

function publicPath(url: string): string | null {
  if (!url.startsWith('/')) return null;
  return path.join(PUBLIC, url.replace(/^\//, ''));
}

const missing: Array<{ label: string; url: string; file: string }> = [];
const warnings: string[] = [];
const seenUrls = new Set<string>();

function checkPublicUrl(label: string, url: string): void {
  if (!url.startsWith('/')) return;
  if (seenUrls.has(url)) return;
  seenUrls.add(url);

  const file = publicPath(url);
  if (!file) return;
  if (!existsSync(file)) {
    missing.push({ label, url, file });
    return;
  }

  if (url.endsWith('.glb') || url.endsWith('.gltf')) {
    try {
      const bytes = statSync(file).size;
      if (bytes > GLB_SIZE_WARN_BYTES) {
        warnings.push(
          `${label}: ${url} is ${(bytes / (1024 * 1024)).toFixed(1)} MB (budget hint ≤ ${GLB_SIZE_WARN_BYTES / (1024 * 1024)} MB)`,
        );
      }
    } catch {
      /* ignore stat errors */
    }
  }
}

for (const [id, asset] of Object.entries(ASSET_MANIFEST)) {
  for (const lod of asset.lods) {
    checkPublicUrl(`${id} lod`, lod.url);
    if (lod.triangles !== undefined && lod.triangles > 20000) {
      warnings.push(`${id} lod ${lod.url}: triangle budget ${lod.triangles} exceeds 20k hint`);
    }
  }
  if (asset.variants) {
    for (const [kind, url] of Object.entries(asset.variants)) {
      if (!url) continue;
      checkPublicUrl(`${id} variant:${kind}`, url);
    }
  }
  if (asset.impostor?.url) {
    checkPublicUrl(`${id} impostor`, asset.impostor.url);
  }
  if (asset.bakedLightmap) {
    checkPublicUrl(`${id} lightmap`, asset.bakedLightmap);
  }
}

for (const [key, url] of Object.entries(LOCAL_MODEL_PATHS)) {
  checkPublicUrl(`modelUrls.${key}`, url);
}

if (warnings.length > 0) {
  console.warn(`⚠ ${warnings.length} asset warning(s):`);
  for (const w of warnings) console.warn(`  - ${w}`);
}

if (missing.length === 0) {
  console.log(
    `✓ All ${Object.keys(ASSET_MANIFEST).length} manifest assets + ${seenUrls.size} unique URL(s) resolved on disk.`,
  );
  process.exit(0);
}

console.error(`✗ Missing ${missing.length} asset file(s):`);
for (const m of missing) {
  console.error(`  - ${m.label}: ${m.url} (expected ${path.relative(ROOT, m.file)})`);
}

if (warnOnly) {
  console.warn('Continuing with --warn-only');
  process.exit(0);
}

process.exit(1);
