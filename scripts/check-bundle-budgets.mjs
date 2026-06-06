#!/usr/bin/env node
/**
 * Post-build bundle budget checker.
 * Reads config/performanceBudgets.json and measures gzip sizes in dist/assets/.
 *
 * Usage:
 *   node scripts/check-bundle-budgets.mjs          # fail on hardMax (boot menu gate)
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

function sumTierGzip(chunks, patterns) {
  return chunks
    .filter((c) => matchesAny(c.file, patterns))
    .reduce((sum, c) => sum + c.gzip, 0);
}

function listTierChunks(chunks, patterns) {
  return chunks.filter((c) => matchesAny(c.file, patterns));
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
  let tier = 'other';
  if (matchesAny(file, budgets.bundleTiers.lazyPrefixes)) tier = 'lazy';
  else if (matchesAny(file, budgets.bundleTiers.bootMenu ?? budgets.bundleTiers.firstScene)) {
    tier = matchesAny(file, budgets.bundleTiers.gameStart ?? []) ? 'gameStart' : 'bootMenu';
  }
  return { file, raw, gzip, tier };
});

const bootMenuPatterns = budgets.bundleTiers.bootMenu ?? budgets.bundleTiers.firstScene;
const gameStartPatterns = budgets.bundleTiers.gameStart ?? [];
const firstScenePatterns = budgets.bundleTiers.firstScene;

const bootMenuGzip = sumTierGzip(chunks, bootMenuPatterns);
const gameStartGzip = sumTierGzip(chunks, gameStartPatterns);
const cumulativeFirstSceneGzip = sumTierGzip(chunks, firstScenePatterns);

const bootMenuChunks = listTierChunks(chunks, bootMenuPatterns);
const gameStartChunks = listTierChunks(chunks, gameStartPatterns);

const lazyJsGzip = chunks
  .filter((c) => matchesAny(c.file, budgets.bundleTiers.lazyPrefixes))
  .reduce((sum, c) => sum + c.gzip, 0);

const totalJsGzip = chunks.reduce((sum, c) => sum + c.gzip, 0);

const indexCss = cssFiles.find((f) => f.startsWith('index-'));
const cssGzip = indexCss ? gzipBytes(join(distAssets, indexCss)) : 0;

const bootBudget = budgets.bootJsGzipBytes ?? budgets.initialJsGzipBytes;
const gameStartBudget = budgets.gameStartJsGzipBytes;

console.log('\n=== Volodka performance budgets (bundle) ===\n');
console.log(`Boot menu JS (gzip): ${formatKb(bootMenuGzip)}`);
console.log(`  Target: ${formatKb(bootBudget.target)}  Hard max: ${formatKb(bootBudget.hardMax)}`);

if (gameStartBudget && gameStartPatterns.length > 0) {
  console.log(`Game-start JS (gzip, incremental): ${formatKb(gameStartGzip)}`);
  console.log(`  Target: ${formatKb(gameStartBudget.target)}  Hard max: ${formatKb(gameStartBudget.hardMax)}`);
  console.log(`Cumulative to first scene (gzip): ${formatKb(cumulativeFirstSceneGzip)}`);
}

console.log(`  Lazy tier: ${formatKb(lazyJsGzip)}`);
console.log(`  Total JS gzip (all chunks): ${formatKb(totalJsGzip)}`);
console.log(`  Entry CSS gzip (index): ${formatKb(cssGzip)}`);

console.log('\n--- Boot menu chunks (gzip) ---');
bootMenuChunks
  .sort((a, b) => b.gzip - a.gzip)
  .forEach((c) => console.log(`  ${formatKb(c.gzip).padStart(10)}  ${c.file}`));

if (gameStartChunks.length > 0) {
  console.log('\n--- Game-start chunks (gzip) ---');
  gameStartChunks
    .sort((a, b) => b.gzip - a.gzip)
    .forEach((c) => console.log(`  ${formatKb(c.gzip).padStart(10)}  ${c.file}`));
}

const violations = [];

const bootOverHard = bootMenuGzip - bootBudget.hardMax;
if (bootMenuGzip > bootBudget.hardMax) {
  violations.push(
    `Boot menu JS ${formatKb(bootMenuGzip)} exceeds hard max ${formatKb(bootBudget.hardMax)} (+${formatKb(bootOverHard)})`,
  );
} else if (bootMenuGzip > bootBudget.target) {
  console.log(`\n⚠ Boot menu over target by ${formatKb(bootMenuGzip - bootBudget.target)} (within hard max).`);
}

if (gameStartBudget && gameStartGzip > gameStartBudget.hardMax) {
  violations.push(
    `Game-start JS ${formatKb(gameStartGzip)} exceeds hard max ${formatKb(gameStartBudget.hardMax)} (+${formatKb(gameStartGzip - gameStartBudget.hardMax)})`,
  );
} else if (gameStartBudget && gameStartGzip > gameStartBudget.target) {
  console.log(`\n⚠ Game-start over target by ${formatKb(gameStartGzip - gameStartBudget.target)} (within hard max).`);
}

const threeChunk = gameStartChunks.find((c) => c.file.startsWith('three-'));
if (threeChunk) {
  const pct = gameStartGzip > 0 ? ((threeChunk.gzip / gameStartGzip) * 100).toFixed(0) : '0';
  console.log(`\nNote: three.js chunk is ${pct}% of game-start JS.`);
}

if (violations.length > 0) {
  console.error('\n✖ Budget violations:');
  violations.forEach((v) => console.error(`  • ${v}`));
  if (!reportOnly) process.exit(1);
} else {
  console.log('\n✓ Bundle budgets OK.');
}

console.log('');
