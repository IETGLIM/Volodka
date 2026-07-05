#!/usr/bin/env node
/**
 * Basic sanity check: default spawn should be at or above floor level for every scene.
 * Usage: node scripts/validate-scene-colliders.mjs
 */

import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const sceneDefsPath = path.join(root, 'src/config/sceneDefinitions.ts');
const source = readFileSync(sceneDefsPath, 'utf8');

const defRe = /export const (\w+):\s*SceneDefinition\s*=\s*\{([\s\S]*?)\n\};/g;
const failures = [];
let checked = 0;

for (const match of source.matchAll(defRe)) {
  const block = match[2];
  const idMatch = block.match(/id:\s*'([^']+)'/);
  const spawnMatch = block.match(/defaultSpawn:\s*\[[^\]]+\]/);
  const floorMatch = block.match(
    /floors:\s*\[\s*\{[^}]*position:\s*\[[^\]]+\]/,
  );
  if (!idMatch || !spawnMatch) continue;

  const sceneId = idMatch[1];
  const spawnParts = spawnMatch[0].match(/[-\d.]+/g) ?? [];
  const spawnY = Number.parseFloat(spawnParts[1] ?? 'NaN');

  let floorY = spawnY;
  if (floorMatch) {
    const floorPos = floorMatch[0].match(/position:\s*\[([^\]]+)\]/);
    const floorParts = floorPos?.[1].split(',').map((s) => s.trim()) ?? [];
    const floorCenterY = Number.parseFloat(floorParts[1] ?? 'NaN');
    const floorHalfHeight = 0.05;
    if (Number.isFinite(floorCenterY)) {
      floorY = floorCenterY + floorHalfHeight;
    }
  }

  checked += 1;
  if (!Number.isFinite(spawnY)) {
    failures.push(`${sceneId}: could not parse defaultSpawn Y`);
    continue;
  }
  if (spawnY < floorY - 0.05) {
    failures.push(`${sceneId}: spawnY ${spawnY} below inferred floorY ${floorY}`);
  }
}

if (failures.length > 0) {
  console.error('Collider validation failed:');
  for (const line of failures) console.error(`  - ${line}`);
  process.exit(1);
}

console.log(`Collider validation passed (${checked} scenes checked).`);
