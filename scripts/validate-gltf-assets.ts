/**
 * Verify ASSET_MANIFEST paths exist on disk (LOD + compression variants).
 * Run after `npm run assets:process` or in CI when models are checked in.
 *
 * Usage: npx tsx scripts/validate-gltf-assets.ts [--warn-only]
 */

import { existsSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { ASSET_MANIFEST } from '../src/config/assetManifest';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const PUBLIC = path.join(ROOT, 'public');
const warnOnly = process.argv.includes('--warn-only');

function publicPath(url: string): string | null {
  if (!url.startsWith('/')) return null;
  return path.join(PUBLIC, url.replace(/^\//, ''));
}

const missing: Array<{ label: string; url: string; file: string }> = [];

for (const [id, asset] of Object.entries(ASSET_MANIFEST)) {
  for (const lod of asset.lods) {
    const file = publicPath(lod.url);
    if (file && !existsSync(file)) missing.push({ label: `${id} lod`, url: lod.url, file });
  }
  if (asset.variants) {
    for (const [kind, url] of Object.entries(asset.variants)) {
      if (!url) continue;
      const file = publicPath(url);
      if (file && !existsSync(file)) missing.push({ label: `${id} variant:${kind}`, url, file });
    }
  }
  if (asset.impostor?.url) {
    const file = publicPath(asset.impostor.url);
    if (file && !existsSync(file)) {
      missing.push({ label: `${id} impostor`, url: asset.impostor.url, file });
    }
  }
  if (asset.bakedLightmap) {
    const file = publicPath(asset.bakedLightmap);
    if (file && !existsSync(file)) {
      missing.push({ label: `${id} lightmap`, url: asset.bakedLightmap, file });
    }
  }
}

if (missing.length === 0) {
  console.log(`✓ All ${Object.keys(ASSET_MANIFEST).length} manifest assets resolved on disk.`);
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
