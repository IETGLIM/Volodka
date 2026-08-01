#!/usr/bin/env node
/**
 * Report byte-identical GLBs under public/models (MD5 groups).
 * Usage: node scripts/report-model-duplicates.mjs [--min-kb=64]
 */
import { createHash } from 'node:crypto';
import { createReadStream, existsSync, readdirSync, statSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const MODELS = path.join(ROOT, 'public', 'models');

const minKb = Number(
  (process.argv.find((a) => a.startsWith('--min-kb=')) ?? '--min-kb=64').split('=')[1],
);
const minBytes = Math.max(0, minKb) * 1024;

function walk(dir, out = []) {
  if (!existsSync(dir)) return out;
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(full, out);
    else if (entry.name.endsWith('.glb')) out.push(full);
  }
  return out;
}

function md5File(file) {
  return new Promise((resolve, reject) => {
    const hash = createHash('md5');
    const stream = createReadStream(file);
    stream.on('data', (chunk) => hash.update(chunk));
    stream.on('error', reject);
    stream.on('end', () => resolve(hash.digest('hex')));
  });
}

const files = walk(MODELS).filter((f) => statSync(f).size >= minBytes);
const byHash = new Map();

for (const file of files) {
  const digest = await md5File(file);
  const size = statSync(file).size;
  const group = byHash.get(digest) ?? { size, files: [] };
  group.files.push(path.relative(ROOT, file).replace(/\\/g, '/'));
  byHash.set(digest, group);
}

const dupes = [...byHash.entries()]
  .filter(([, g]) => g.files.length > 1)
  .sort((a, b) => b[1].size * b[1].files.length - a[1].size * a[1].files.length);

let waste = 0;
for (const [, g] of dupes) {
  waste += g.size * (g.files.length - 1);
}

console.log(`Scanned ${files.length} GLBs (≥${minKb} KB) under public/models`);
console.log(`Duplicate groups: ${dupes.length}`);
console.log(`Redundant bytes (keep 1 per group): ${(waste / (1024 * 1024)).toFixed(2)} MB\n`);

for (const [hash, g] of dupes.slice(0, 40)) {
  const mb = (g.size / (1024 * 1024)).toFixed(2);
  console.log(`≡ ${hash.slice(0, 12)}…  ${mb} MB × ${g.files.length}`);
  for (const f of g.files) console.log(`    ${f}`);
}

if (dupes.length > 40) {
  console.log(`\n… +${dupes.length - 40} more groups`);
}
