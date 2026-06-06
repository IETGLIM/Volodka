#!/usr/bin/env node
/**
 * Post-build bundle budget checker.
 * Reads config/performanceBudgets.json and measures gzip sizes in dist/assets/.
 *
 * Usage:
 *   node scripts/check-bundle-budgets.mjs          # fail on hardMax
 *   node scripts/check-bundle-budgets.mjs --report # always exit 0, print table
 */

import { readFileSync, readdirSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { gzipSync } from 'node:zlib';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, '..');
const distAssets = join(root, 'dist', 'assets');
const reportOnly = process.argv.includes('--report');

const budgets = JSON.parse(
  readFileSync(join(root, 'config', 'performanceBudgets.json'), 'utf8'),
);

function gzipBytes(filePath) {
  return gzipSync(readFileSync(filePath)).length;
}

function formatKb(bytes) {
  return `${(bytes / 1024).toFixed(1)} KB`;
}

function matchesAny(name, patterns) {
  return patterns.some((p) => new RegExp(p).test(name));
}

function classifyChunk(name) {
  if (matchesAny(name, budgets.bundleTiers.firstScene)) return 'firstScene';
  if (matchesAny(name, budgets.bundleTiers.lazyPrefixes)) return 'lazy';
  if (matchesAny(name, budgets.bundleTiers.boot)) return 'boot';
  return 'other';
}

if (!existsSync(distAssets)) {
  console.error('[budgets] dist/assets not found — run `npm run build` first.');
  process.exit(1);
}

const jsFiles = readdirSync(distAssets).filter((f) => f.endsWith('.js'));
const cssFiles = readdirSync(distAssets).filter((f) => f.endsWith('.css'));

const chunks = jsFiles.map((file) => {
  const path = join(distAssets, file);
  const raw = readFileSync(path).length;
  const gzip = gzipBytes(path);
  const tier = classifyChunk(file);
  return { file, raw, gzip, tier };
});

const tierTotals = { boot: 0, firstScene: 0, lazy: 0, other: 0 };
const tierLists = { boot: [], firstScene: [], lazy: [], other: [] };

for (const chunk of chunks) {
  tierTotals[chunk.tier] += chunk.gzip;
  tierLists[chunk.tier].push(chunk);
}

const bootGzip = chunks
  .filter((c) => matchesAny(c.file, budgets.bundleTiers.boot))
  .reduce((sum, c) => sum + c.gzip, 0);

/** firstScene tier — all chunks needed before default scene is playable */
const initialJsGzip = chunks
  .filter((c) => matchesAny(c.file, budgets.bundleTiers.firstScene))
  .reduce((sum, c) => sum + c.gzip, 0);

const firstSceneChunks = chunks.filter((c) =>
  matchesAny(c.file, budgets.bundleTiers.firstScene),
);

const lazyJsGzip = tierTotals.lazy;
const totalJsGzip = chunks.reduce((sum, c) => sum + c.gzip, 0);

const indexCss = cssFiles.find((f) => f.startsWith('index-'));
const cssGzip = indexCss ? gzipBytes(join(distAssets, indexCss)) : 0;

const { initialJsGzipBytes } = budgets;
const overTarget = initialJsGzip - initialJsGzipBytes.target;
const overHard = initialJsGzip - initialJsGzipBytes.hardMax;

console.log('\n=== Volodka performance budgets (bundle) ===\n');
console.log(`Initial JS (first-scene tier, gzip): ${formatKb(initialJsGzip)}`);
console.log(`  Target: ${formatKb(initialJsGzipBytes.target)}  Hard max: ${formatKb(initialJsGzipBytes.hardMax)}`);
console.log(`  Boot-only (index+vendor): ${formatKb(bootGzip)}`);
console.log(`  Lazy tier (should not block first scene): ${formatKb(lazyJsGzip)}`);
console.log(`  Other / unclassified JS: ${formatKb(tierTotals.other)}`);
console.log(`  Total JS gzip (all chunks): ${formatKb(totalJsGzip)}`);
console.log(`  Entry CSS gzip (index): ${formatKb(cssGzip)}`);

console.log('\n--- First-scene chunks (gzip) ---');
firstSceneChunks
  .sort((a, b) => b.gzip - a.gzip)
  .forEach((c) => console.log(`  ${formatKb(c.gzip).padStart(10)}  ${c.file}`));

if (tierLists.other.length > 0) {
  console.log('\n--- Unclassified (review tier rules) ---');
  tierLists.other
    .sort((a, b) => b.gzip - a.gzip)
    .slice(0, 10)
    .forEach((c) => console.log(`  ${formatKb(c.gzip).padStart(10)}  ${c.file}`));
}

console.log('\n--- Top lazy chunks (gzip) ---');
tierLists.lazy
  .sort((a, b) => b.gzip - a.gzip)
  .slice(0, 8)
  .forEach((c) => console.log(`  ${formatKb(c.gzip).padStart(10)}  ${c.file}`));

const violations = [];

if (initialJsGzip > initialJsGzipBytes.hardMax) {
  violations.push(
    `Initial JS ${formatKb(initialJsGzip)} exceeds hard max ${formatKb(initialJsGzipBytes.hardMax)} (+${formatKb(overHard)})`,
  );
} else if (initialJsGzip > initialJsGzipBytes.target) {
  console.log(`\n⚠ Over target by ${formatKb(overTarget)} (within hard max).`);
}

const threeChunk = firstSceneChunks.find((c) => c.file.startsWith('three-'));
if (threeChunk) {
  const pct = ((threeChunk.gzip / initialJsGzip) * 100).toFixed(0);
  console.log(`\nNote: three.js chunk is ${pct}% of first-scene JS — primary optimization lever.`);
}

if (violations.length > 0) {
  console.error('\n✖ Budget violations:');
  violations.forEach((v) => console.error(`  • ${v}`));
  if (!reportOnly) process.exit(1);
} else {
  console.log('\n✓ Bundle budgets OK.');
}

console.log('');
