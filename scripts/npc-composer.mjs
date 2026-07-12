#!/usr/bin/env node
/**
 * Bake NPC Composer manifest + stage Quaternius rig GLBs for runtime retarget.
 *
 * Usage:
 *   npm run assets:npc-composer
 */
import { copyFileSync, existsSync, mkdirSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const OUT = path.join(ROOT, 'assets-source/ai3dgen/npcs/npc-composer-manifest.json');
const SOURCE_NPCS = path.join(ROOT, 'assets-source/ai3dgen/npcs');
const STAGED_RIGS = path.join(ROOT, 'public/models/npcs/_rigs');
const BAKE = path.join(ROOT, 'scripts/npc-composer-bake.ts');
const npx = process.platform === 'win32' ? 'npx.cmd' : 'npx';

const RIG_GLB_FILES = [
  ...Array.from({ length: 11 }, (_, i) => `male_${String(i + 1).padStart(2, '0')}.glb`),
  ...Array.from({ length: 9 }, (_, i) => `female_${String(i + 1).padStart(2, '0')}.glb`),
];

const result = spawnSync(
  npx,
  ['tsx', '--tsconfig', 'tsconfig.json', BAKE],
  { cwd: ROOT, encoding: 'utf8', shell: true, stdio: ['inherit', 'pipe', 'pipe'] },
);

if (result.status !== 0) {
  if (result.stderr) process.stderr.write(result.stderr);
  process.exit(result.status ?? 1);
}

const manifest = JSON.parse(result.stdout);
mkdirSync(path.dirname(OUT), { recursive: true });
writeFileSync(OUT, `${JSON.stringify(manifest, null, 2)}\n`, 'utf8');
console.log(`Wrote ${OUT} (${manifest.length} composed NPCs)`);

mkdirSync(STAGED_RIGS, { recursive: true });
let staged = 0;
for (const file of RIG_GLB_FILES) {
  const src = path.join(SOURCE_NPCS, file);
  const dest = path.join(STAGED_RIGS, file);
  if (!existsSync(src)) continue;
  copyFileSync(src, dest);
  staged += 1;
}
console.log(`Staged ${staged} rig GLBs → public/models/npcs/_rigs/`);
