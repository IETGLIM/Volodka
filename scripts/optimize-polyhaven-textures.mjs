/**
 * Convert Poly Haven PBR texture JPGs → WebP (quality 85, lossy but visually
 * indistinguishable for PBR maps at the resolutions we ship).
 *
 * WebP is supported by THREE.TextureLoader / drei useTexture natively (browsers
 * decode it; the loader doesn't care about the container format). getPolyHavenMapUrl
 * in src/config/polyhavenAssets.ts is updated to return .webp URLs.
 *
 * Normal maps (nor_gl) are kept lossless-ish (quality 92) to avoid compression
 * artifacts that would break lighting; diff/rough/ao use quality 85.
 */
import sharp from 'sharp';
import { readdirSync, statSync, rmSync, renameSync, existsSync } from 'node:fs';
import path from 'node:path';
import { readFileSync, writeFileSync } from 'node:fs';

const ROOT = path.resolve(import.meta.dirname, '..');
const TEX = path.join(ROOT, 'public', 'textures', 'polyhaven');
const ASSETS_TS = path.join(ROOT, 'src', 'config', 'polyhavenAssets.ts');

async function convertOne(file) {
  const isNormal = /_nor_gl_/.test(file);
  const quality = isNormal ? 92 : 85;
  const out = file.replace(/\.jpg$/i, '.webp');
  await sharp(file)
    .webp({ quality, effort: 4 })
    .toFile(out);
  const before = statSync(file).size;
  const after = statSync(out).size;
  rmSync(file);
  return { before, after, isNormal };
}

async function main() {
  const files = [];
  function walk(d) {
    for (const e of readdirSync(d, { withFileTypes: true })) {
      const full = path.join(d, e.name);
      if (e.isDirectory()) walk(full);
      else if (/\.jpg$/i.test(e.name)) files.push(full);
    }
  }
  walk(TEX);

  console.log(`Converting ${files.length} JPG → WebP in ${TEX}\n`);
  let totalBefore = 0, totalAfter = 0;
  for (const f of files) {
    const r = await convertOne(f);
    totalBefore += r.before;
    totalAfter += r.after;
    const rel = path.relative(TEX, f);
    console.log(`  ${rel}: ${(r.before / 1024).toFixed(0)} KB → ${(r.after / 1024).toFixed(0)} KB (×${(r.before / r.after).toFixed(1)}${r.isNormal ? ', normal' : ''})`);
  }

  console.log(`\nTotal: ${(totalBefore / 1024 / 1024).toFixed(2)} MB → ${(totalAfter / 1024 / 1024).toFixed(2)} MB (${((1 - totalAfter / totalBefore) * 100).toFixed(1)}% saved)`);

  // Update polyhavenAssets.ts: .jpg → .webp in getPolyHavenMapUrl return
  let src = readFileSync(ASSETS_TS, 'utf8');
  const before = src;
  src = src.replace(
    /(\/textures\/polyhaven\/[^'"]+)\.jpg'/g,
    "$1.webp'",
  );
  if (src !== before) {
    writeFileSync(ASSETS_TS, src, 'utf8');
    const changed = (before.match(/\.jpg'/g) || []).length - (src.match(/\.jpg'/g) || []).length;
    console.log(`Updated ${changed} .jpg → .webp references in polyhavenAssets.ts`);
  } else {
    // The URL is built dynamically: return `/textures/polyhaven/${materialId}/${materialId}_${map}_${useRes}.jpg`;
    src = src.replace(/\.jpg'/g, ".webp'");
    if (src !== before) {
      writeFileSync(ASSETS_TS, src, 'utf8');
      console.log('Updated dynamic .jpg → .webp references in polyhavenAssets.ts');
    } else {
      console.log('No .jpg references found in polyhavenAssets.ts');
    }
  }
}

main().catch((e) => { console.error(e); process.exit(1); });
