/**
 * Verify built dist contains expected static asset paths for Vercel deploy.
 * Usage: npm run build && npx tsx scripts/verify-deploy-assets.ts
 */
import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { ASSET_MANIFEST } from '../src/config/assetManifest';
import { getNpcModelUrls } from '../src/config/npcModelRegistry';
import { getPropModelUrls } from '../src/config/propModelRegistry';
import { MODEL_URLS } from '../src/config/modelUrls';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const distDir = path.join(ROOT, 'dist');
const PUBLIC = path.join(ROOT, 'public');

/** Vercel hobby deployment soft limit — warn above this. */
const DEPLOY_SIZE_WARN_MB = 200;
const DEPLOY_SIZE_HARD_MB = 250;

const issues: string[] = [];
const warnings: string[] = [];

if (!existsSync(distDir)) {
  console.error('dist/ not found — run npm run build first');
  process.exit(1);
}

function loadRequiredPublicPaths(): string[] {
  const paths = new Set(['index.html', 'models/fps/fps_arms.glb']);

  for (const asset of Object.values(ASSET_MANIFEST)) {
    if (asset.shipped !== true) continue;
    for (const lod of asset.lods) paths.add(lod.url.replace(/^\//, ''));
    if (asset.variants) {
      for (const url of Object.values(asset.variants)) {
        if (url) paths.add(url.replace(/^\//, ''));
      }
    }
    if (asset.impostor?.url) paths.add(asset.impostor.url.replace(/^\//, ''));
    if (asset.bakedLightmap) paths.add(asset.bakedLightmap.replace(/^\//, ''));
  }

  for (const url of getNpcModelUrls()) paths.add(url.replace(/^\//, ''));
  for (const url of getPropModelUrls()) paths.add(url.replace(/^\//, ''));
  for (const url of Object.values(MODEL_URLS)) paths.add(url.replace(/^\//, ''));

  return [...paths];
}

function dirSizeBytes(dir: string): number {
  let total = 0;
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) total += dirSizeBytes(full);
    else total += statSync(full).size;
  }
  return total;
}

const requiredPublicPaths = loadRequiredPublicPaths();

for (const rel of requiredPublicPaths) {
  const inDist = path.join(distDir, rel);
  const inPublic = path.join(PUBLIC, rel);
  if (!existsSync(inDist) && !existsSync(inPublic)) {
    issues.push(`missing asset: ${rel} (not in dist/ or public/)`);
  } else if (!existsSync(inDist) && existsSync(inPublic)) {
    warnings.push(`present in public/ but not copied to dist/: ${rel}`);
  }
}

const indexHtml = existsSync(path.join(distDir, 'index.html'))
  ? readFileSync(path.join(distDir, 'index.html'), 'utf8')
  : '';
if (indexHtml && !indexHtml.includes('/assets/')) {
  issues.push('index.html does not reference bundled /assets/ chunks');
}

const distMb = dirSizeBytes(distDir) / (1024 * 1024);
if (distMb > DEPLOY_SIZE_HARD_MB) {
  issues.push(`dist/ size ${distMb.toFixed(1)} MB exceeds hard limit ${DEPLOY_SIZE_HARD_MB} MB`);
} else if (distMb > DEPLOY_SIZE_WARN_MB) {
  warnings.push(
    `dist/ size ${distMb.toFixed(1)} MB — approaching Vercel limit (${DEPLOY_SIZE_HARD_MB} MB)`,
  );
}

if (warnings.length > 0) {
  console.warn('Deploy asset verification warnings:');
  for (const w of warnings) console.warn(`  - ${w}`);
}

if (issues.length > 0) {
  console.error('Deploy asset verification failed:');
  for (const issue of issues) console.error(`  - ${issue}`);
  process.exit(1);
}

console.log(
  `Deploy asset verification: OK (${requiredPublicPaths.length} paths, dist ${distMb.toFixed(1)} MB)`,
);
