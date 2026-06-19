#!/usr/bin/env node
/**
 * Extract humanoid animation clips from a Quaternius CC0 GLB into
 * public/models/animations/ for the NPC animation pipeline.
 *
 * Source rig: Quaternius Ultimate Modular Characters (CC0)
 * https://quaternius.com/packs/ultimatemodularcharacters.html
 *
 * Usage:
 *   node scripts/extract-quaternius-animations.mjs
 */

import { copyFileSync, existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { writeMixamoClipIdsOnDisk } from './lib/mixamoOnDisk.mjs';
import { parseGlb, buildGlb, stripAnimationGlb } from './lib/stripAnimationGlb.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const ON_DISK_MODULE = path.join(ROOT, 'src/config/mixamoClipsOnDisk.ts');
const DEFAULT_SOURCE = path.join(ROOT, 'public/models/npcs/albert.glb');

/**
 * clipId → Quaternius clip name inside the source GLB.
 * Pack has no true sit/sleep mocap — best available poses:
 *   sitting/work → Interact (crouch/reach), sleeping → Death (prone).
 */
const CLIP_MAP = {
  idle: 'Idle',
  walking: 'Walk',
  talking: 'Wave',
  sitting: 'Interact',
  sleeping: 'Death',
  working: 'Interact',
};

function extractSingleAnimation(sourcePath, quaterniusName, canonicalName) {
  const buffer = readFileSync(sourcePath);
  const { json, bin } = parseGlb(buffer);
  const anim = (json.animations ?? []).find((a) => a.name === quaterniusName);
  if (!anim) {
    throw new Error(`Animation "${quaterniusName}" not found in ${path.relative(ROOT, sourcePath)}`);
  }
  const nextJson = { ...json, animations: [{ ...anim, name: canonicalName }] };
  return stripAnimationGlb(buildGlb(nextJson, bin));
}

function parseArgs(argv) {
  const args = { source: DEFAULT_SOURCE, help: false };
  for (let i = 2; i < argv.length; i += 1) {
    const token = argv[i];
    if (token === '--source') args.source = path.resolve(argv[++i] ?? DEFAULT_SOURCE);
    else if (token === '--help' || token === '-h') args.help = true;
  }
  return args;
}

async function main() {
  const args = parseArgs(process.argv);
  if (args.help) {
    console.log('Usage: node scripts/extract-quaternius-animations.mjs [--source <glb>]');
    return;
  }

  if (!existsSync(args.source)) {
    console.error(`Source GLB not found: ${args.source}`);
    process.exit(1);
  }

  const catalogMod = await import(
    pathToFileURL(path.join(ROOT, 'src/config/mixamoAnimationCatalog.ts')).href
  );
  const catalog = catalogMod.MIXAMO_ANIMATION_CATALOG;
  const onDisk = [];

  console.log(`Extracting Quaternius animations from ${path.relative(ROOT, args.source)}…\n`);

  for (const entry of catalog) {
    const quaterniusName = CLIP_MAP[entry.id];
    if (!quaterniusName) {
      console.warn(`⚠ Skip ${entry.id} — no Quaternius clip mapping`);
      continue;
    }

    const glb = extractSingleAnimation(args.source, quaterniusName, entry.canonicalClipName);
    const sourceDir = path.join(ROOT, entry.sourceRelativePath);
    const publicDir = path.join(ROOT, 'public', entry.publicUrl.replace(/^\//, ''));
    mkdirSync(path.dirname(sourceDir), { recursive: true });
    mkdirSync(path.dirname(publicDir), { recursive: true });
    writeFileSync(sourceDir, glb);
    copyFileSync(sourceDir, publicDir);
    onDisk.push(entry.id);
    console.log(
      `✓ ${entry.id} (${quaterniusName} → ${entry.canonicalClipName}) → ${entry.publicUrl} (${(glb.length / 1024).toFixed(0)} KB)`,
    );
  }

  writeMixamoClipIdsOnDisk(ON_DISK_MODULE, onDisk);
  console.log(`\n✓ Updated MIXAMO_CLIP_IDS_ON_DISK (${onDisk.length} clips)`);
  console.log('  Next: npm run assets:validate');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
