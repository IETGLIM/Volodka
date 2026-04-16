/**
 * Downloads scene JPEG/PNG from manifest, writes WebP to public/scenes/{sceneId}.webp
 * Run: node scripts/download-scene-backgrounds.mjs
 */
import { mkdirSync, readFileSync, existsSync, unlinkSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

const __dirname = dirname(fileURLToPath(import.meta.url));
const force = process.argv.includes('--force');
const root = join(__dirname, '..');
const outDir = join(root, 'public', 'scenes');
const manifestPath = join(__dirname, 'scene-background-sources.json');

mkdirSync(outDir, { recursive: true });

const manifest = JSON.parse(readFileSync(manifestPath, 'utf8'));
const { scenes } = manifest;

async function downloadToBuffer(url) {
  const res = await fetch(url, {
    headers: {
      'User-Agent': 'VolodkaSceneAssets/1.0 (https://github.com; asset pipeline)',
    },
  });
  if (!res.ok) throw new Error(`HTTP ${res.status} for ${url}`);
  return Buffer.from(await res.arrayBuffer());
}

for (const row of scenes) {
  const { sceneId, downloadUrl } = row;
  const dest = join(outDir, `${sceneId}.webp`);
  if (existsSync(dest) && !force) {
    console.log(`skip (exists): ${sceneId}`);
    continue;
  }
  if (existsSync(dest) && force) unlinkSync(dest);
  try {
    console.log(`fetch: ${sceneId}`);
    const buf = await downloadToBuffer(downloadUrl);
    await sharp(buf)
      .resize(1920, 1080, { fit: 'cover', position: 'attention' })
      .webp({ quality: 82 })
      .toFile(dest);
    console.log(`ok: ${dest}`);
  } catch (e) {
    const err = /** @type {Error & { cause?: unknown }} */ (e);
    const cause = err.cause instanceof Error ? ` cause=${err.cause.message}` : '';
    console.error(`fail: ${sceneId}`, err.message + cause);
    process.exitCode = 1;
  }
}
