#!/usr/bin/env node
/**
 * CI: после `next build` — суммарный размер `.next/static` не должен превышать лимит
 * (тяжёлые бинарники, ошибочно попавшие в клиентский бандл).
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const STATIC_DIR = path.join(ROOT, '.next', 'static');

/** Лимит в байтах (400 MiB) */
const MAX_BYTES = 400 * 1024 * 1024;

function dirSizeBytes(dir) {
  let total = 0;
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const ent of entries) {
    const p = path.join(dir, ent.name);
    if (ent.isDirectory()) total += dirSizeBytes(p);
    else if (ent.isFile()) total += fs.statSync(p).size;
  }
  return total;
}

if (!fs.existsSync(STATIC_DIR)) {
  console.error(`[check-next-static-budget] Missing ${path.relative(ROOT, STATIC_DIR)} — run npm run build first.`);
  process.exit(1);
}

const bytes = dirSizeBytes(STATIC_DIR);
const mib = bytes / (1024 * 1024);
const capMib = MAX_BYTES / (1024 * 1024);
console.log(`[check-next-static-budget] .next/static ≈ ${mib.toFixed(2)} MiB (cap ${capMib} MiB)`);

if (bytes > MAX_BYTES) {
  console.error(
    `[check-next-static-budget] FAIL: .next/static exceeds ${capMib} MiB — check bundled assets / imports of large binaries.`,
  );
  process.exit(1);
}
