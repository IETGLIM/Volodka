#!/usr/bin/env node
/**
 * Verify built dist contains expected static asset paths for Vercel deploy.
 * Usage: npm run build && node scripts/verify-deploy-assets.mjs
 */
import fs from 'node:fs';
import path from 'node:path';

const distDir = path.resolve('dist');
const requiredPublicPaths = [
  'index.html',
  'models/npcs/cafe_barista.glb',
  'models/npcs/office_colleague.glb',
];

const issues = [];

if (!fs.existsSync(distDir)) {
  console.error('dist/ not found — run npm run build first');
  process.exit(1);
}

for (const rel of requiredPublicPaths) {
  const full = path.join(distDir, rel);
  if (!fs.existsSync(full)) {
    issues.push(`missing dist asset: ${rel}`);
  }
}

const indexHtml = fs.readFileSync(path.join(distDir, 'index.html'), 'utf8');
if (!indexHtml.includes('/assets/')) {
  issues.push('index.html does not reference bundled /assets/ chunks');
}

if (issues.length > 0) {
  console.error('Deploy asset verification failed:');
  for (const issue of issues) console.error(`  - ${issue}`);
  process.exit(1);
}

console.log('Deploy asset verification: OK');
