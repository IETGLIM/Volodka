#!/usr/bin/env node
/**
 * Stage CC0 Kenney City Kit props + interior shells from assets-source/ai3dgen
 * into public/models/ for runtime and deploy validation.
 *
 * Source layout (see assets-source/ai3dgen/README.md):
 *   props/      — 10 Kenney GLBs (bench, lamp_post, …)
 *   interiors/  — 10 interior shells (Kenney fallback until Poly Pizza GLBs land)
 *
 * Usage: npm run assets:freekit-stage
 */
import { copyFileSync, existsSync, mkdirSync, readdirSync, statSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const SOURCE = path.join(ROOT, 'assets-source/ai3dgen');

const STAGE_TARGETS = [
  { from: 'props', to: 'public/models/props/citykit' },
  { from: 'interiors', to: 'public/models/interiors' },
];

const INTERIOR_TEXTURE_REL = 'interiors/Textures/colormap.png';
const CITYKIT_TEXTURE_REL = 'props/citykit/Textures/colormap.png';

function stageKenneyColormapTextures() {
  const candidates = [
    path.join(SOURCE, INTERIOR_TEXTURE_REL),
    path.join(ROOT, '.tmp-kenney/extract/suburban/Models/GLB format/Textures/colormap.png'),
    path.join(ROOT, 'public/models', INTERIOR_TEXTURE_REL),
  ];
  const src = candidates.find((p) => existsSync(p));
  if (!src) {
    console.warn('⚠ skip Kenney colormap — no source texture found');
    return 0;
  }
  let count = 0;
  for (const rel of [INTERIOR_TEXTURE_REL, CITYKIT_TEXTURE_REL]) {
    const dest = path.join(ROOT, 'public/models', rel);
    mkdirSync(path.dirname(dest), { recursive: true });
    copyFileSync(src, dest);
    console.log(`✓ ${path.relative(ROOT, dest)}`);
    count += 1;
  }
  return count;
}

function stageDirectory(fromRel, toRel) {
  const fromDir = path.join(SOURCE, fromRel);
  const toDir = path.join(ROOT, toRel);
  if (!existsSync(fromDir)) {
    console.warn(`⚠ skip missing source dir: ${fromRel}`);
    return 0;
  }
  mkdirSync(toDir, { recursive: true });
  let count = 0;
  for (const entry of readdirSync(fromDir, { withFileTypes: true })) {
    if (!entry.isFile() || !entry.name.endsWith('.glb')) continue;
    const src = path.join(fromDir, entry.name);
    const dest = path.join(toDir, entry.name);
    copyFileSync(src, dest);
    count += 1;
    console.log(`✓ ${path.relative(ROOT, dest)}`);
  }
  return count;
}

function reportSize() {
  let total = 0;
  for (const { to } of STAGE_TARGETS) {
    const dir = path.join(ROOT, to);
    if (!existsSync(dir)) continue;
    for (const entry of readdirSync(dir)) {
      if (!entry.endsWith('.glb')) continue;
      total += statSync(path.join(dir, entry)).size;
    }
  }
  console.log(`\nℹ Staged freekit GLB total: ${(total / (1024 * 1024)).toFixed(2)} MB`);
}

function main() {
  console.log('Stage Kenney / freekit assets…\n');
  let total = 0;
  for (const { from, to } of STAGE_TARGETS) {
    total += stageDirectory(from, to);
  }
  total += stageKenneyColormapTextures();
  if (total === 0) {
    console.warn('⚠ No GLB files found under assets-source/ai3dgen/{props,interiors}.');
    console.warn('  Run npm run assets:bootstrap for CC0 fallbacks, or add Kenney sources.');
    return;
  }
  reportSize();
  console.log('\n✓ Freekit staging complete. Next: npm run assets:validate');
}

main();
