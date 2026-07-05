#!/usr/bin/env node
/**
 * Strip mesh/skin data from animation GLBs under public/models/animations/.
 * Keeps skeleton nodes + animation keyframes only (Mixamo "Without Skin" equivalent).
 *
 * Usage:
 *   npm run assets:optimize-animations
 *   node scripts/optimize-animation-glbs.mjs --dir public/models/animations
 */

import { existsSync, readdirSync, readFileSync, statSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { stripAnimationGlb } from './lib/stripAnimationGlb.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const DEFAULT_DIR = path.join(ROOT, 'public/models/animations');

function parseArgs(argv) {
  const args = { dir: DEFAULT_DIR, help: false };
  for (let i = 2; i < argv.length; i += 1) {
    const token = argv[i];
    if (token === '--dir') args.dir = path.resolve(argv[++i] ?? DEFAULT_DIR);
    else if (token === '--help' || token === '-h') args.help = true;
  }
  return args;
}

async function loadCatalogPublicUrls() {
  const mod = await import(
    pathToFileURL(path.join(ROOT, 'src/config/mixamoAnimationCatalog.ts')).href
  );
  return mod.MIXAMO_ANIMATION_CATALOG.map((entry) => entry.publicUrl.replace(/^\//, ''));
}

function formatMb(bytes) {
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

async function main() {
  const args = parseArgs(process.argv);
  if (args.help) {
    console.log('Usage: node scripts/optimize-animation-glbs.mjs [--dir <path>]');
    return;
  }

  if (!existsSync(args.dir)) {
    console.error(`Directory not found: ${args.dir}`);
    process.exit(1);
  }

  const catalogUrls = await loadCatalogPublicUrls();
  const catalogFiles = new Set(
    catalogUrls.map((url) => path.basename(url)).filter((name) => name.endsWith('.glb')),
  );

  const files = readdirSync(args.dir).filter(
    (name) => name.endsWith('.glb') && (catalogFiles.size === 0 || catalogFiles.has(name)),
  );

  if (files.length === 0) {
    console.log('No animation GLBs to optimize.');
    return;
  }

  console.log(`Optimizing ${files.length} animation GLB(s) in ${path.relative(ROOT, args.dir)}…\n`);

  let beforeTotal = 0;
  let afterTotal = 0;

  for (const name of files.sort()) {
    const filePath = path.join(args.dir, name);
    const before = readFileSync(filePath);
    beforeTotal += before.length;
    const stripped = stripAnimationGlb(before);
    writeFileSync(filePath, stripped);
    afterTotal += stripped.length;
    console.log(
      `✓ ${name.padEnd(14)} ${formatMb(before.length).padStart(8)} → ${formatMb(stripped.length).padStart(8)}`,
    );
  }

  const saved = beforeTotal - afterTotal;
  const pct = beforeTotal > 0 ? ((saved / beforeTotal) * 100).toFixed(0) : '0';
  console.log(
    `\nTotal: ${formatMb(beforeTotal)} → ${formatMb(afterTotal)} (−${formatMb(saved)}, ${pct}% smaller)`,
  );
  console.log('  Next: npm run assets:validate');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
