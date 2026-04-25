#!/usr/bin/env node
/**
 * AAA Asset Budget Report
 * Scans propsManifest.ts and public/models* for estimated bytes, GLB sizes, mesh count estimates.
 * Run with: npm run asset-budget
 * Part of P2 from volodka-aaa-expert-audit-2026-04-25.md
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');

console.log('=== Volodka AAA Asset Budget Report ===\n');

let totalEstimatedGeometry = 0;
let totalEstimatedTexture = 0;
let totalGLBSize = 0;
const glbFiles = [];

const propsPath = path.join(ROOT, 'src/data/propsManifest.ts');
if (fs.existsSync(propsPath)) {
  const content = fs.readFileSync(propsPath, 'utf-8');
  const matches = content.matchAll(/estimatedGeometryBytes:\s*(\d+)[_]?(\d+)?/g);
  for (const m of matches) {
    const bytes = parseInt((m[1] + (m[2] || '')).replace(/_/g, ''));
    totalEstimatedGeometry += bytes;
  }
  const textureMatches = content.matchAll(/estimatedTextureBytes:\s*(\d+)[_]?(\d+)?/g);
  for (const m of textureMatches) {
    const bytes = parseInt((m[1] + (m[2] || '')).replace(/_/g, ''));
    totalEstimatedTexture += bytes;
  }
  console.log('PropsManifest summary:');
  console.log(`  Estimated Geometry: ${(totalEstimatedGeometry / 1_000_000).toFixed(2)} MB`);
  console.log(`  Estimated Texture: ${(totalEstimatedTexture / 1_000_000).toFixed(2)} MB`);
}

const modelsDir = path.join(ROOT, 'public/models');
const modelsExternalDir = path.join(ROOT, 'public/models-external');

[modelsDir, modelsExternalDir].forEach(dir => {
  if (!fs.existsSync(dir)) return;
  const files = fs.readdirSync(dir);
  files.forEach(file => {
    if (file.endsWith('.glb') || file.endsWith('.gltf')) {
      const fullPath = path.join(dir, file);
      const stats = fs.statSync(fullPath);
      totalGLBSize += stats.size;
      glbFiles.push({ name: file, sizeMB: (stats.size / 1_000_000).toFixed(2) });
    }
  });
});

console.log('\nGLB files found:');
glbFiles.forEach(f => console.log(`  ${f.name}: ${f.sizeMB} MB`));
console.log(`\nTotal GLB size: ${(totalGLBSize / 1_000_000).toFixed(2)} MB`);

console.log('\nRecommendations for AAA:');
console.log('- Keep total initial load < 8MB for good LCP on Vercel.');
console.log('- Use meshopt/draco compression for GLB.');
console.log('- Implement LOD and streaming v0.2 fully (already in progress).');
console.log('- Add texture budget enforcement in PropModel and NPC.');

console.log('\nReport generated. Run `npm run asset-budget` regularly.');
