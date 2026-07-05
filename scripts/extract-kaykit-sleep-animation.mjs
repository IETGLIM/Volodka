#!/usr/bin/env node
/**
 * Import KayKit Rig_Medium Lie_Idle as the NPC sleeping clip (CC0, Russia-accessible).
 *
 * Source mirror: sketchpunklabs/kaykit_char (KayKit Character Animations, CC0)
 *   res/anim/Med_Simulation.glb → Rig_Medium|Lie_Idle
 *
 * Usage:
 *   npm run assets:kaykit-sleep-import
 *   node scripts/extract-kaykit-sleep-animation.mjs --source <path/to/Med_Simulation.glb>
 */

import { copyFileSync, existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { writeMixamoClipIdsOnDisk } from './lib/mixamoOnDisk.mjs';
import {
  duplicateAnimationBoneChannels,
  remapGlbBoneNames,
} from './lib/kaykitToQuaterniusBoneMap.mjs';
import { parseGlb, buildGlb, stripAnimationGlb } from './lib/stripAnimationGlb.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const ON_DISK_MODULE = path.join(ROOT, 'src/config/mixamoClipsOnDisk.ts');
const DEFAULT_SOURCE = path.join(
  ROOT,
  'assets-source/animations/kaykit/Med_Simulation.glb',
);
const KAYKIT_CLIP_NAME = 'Rig_Medium|Lie_Idle';
const CANONICAL_CLIP_NAME = 'sleeping';

function parseArgs(argv) {
  const args = { source: DEFAULT_SOURCE, help: false };
  for (let i = 2; i < argv.length; i += 1) {
    const token = argv[i];
    if (token === '--source') args.source = path.resolve(argv[++i] ?? DEFAULT_SOURCE);
    else if (token === '--help' || token === '-h') args.help = true;
  }
  return args;
}

function extractSleepClip(sourcePath, kaykitName, canonicalName) {
  const buffer = readFileSync(sourcePath);
  const { json, bin } = parseGlb(buffer);
  const anim = (json.animations ?? []).find((a) => a.name === kaykitName);
  if (!anim) {
    const available = (json.animations ?? []).map((a) => a.name).sort().join(', ');
    throw new Error(
      `Animation "${kaykitName}" not found in ${path.relative(ROOT, sourcePath)}. Available: ${available}`,
    );
  }

  let remapped = remapGlbBoneNames(json);
  remapped = duplicateAnimationBoneChannels(remapped);
  const nextJson = { ...remapped, animations: [{ ...anim, name: canonicalName }] };
  return stripAnimationGlb(buildGlb(nextJson, bin));
}

function printHelp() {
  console.log(`
KayKit sleep import — Volodka RPG (CC0)

  npm run assets:kaykit-sleep-import

Extracts KayKit Rig_Medium Lie_Idle → sleeping.glb (retargeted to modular NPC bones).

Source: KayKit Character Animations (CC0)
  ${DEFAULT_SOURCE}
`);
}

async function main() {
  const args = parseArgs(process.argv);
  if (args.help) {
    printHelp();
    return;
  }

  if (!existsSync(args.source)) {
    console.error(`Source GLB not found: ${args.source}`);
    console.error('Copy Med_Simulation.glb from KayKit pack to assets-source/animations/kaykit/');
    process.exit(1);
  }

  const catalogMod = await import(
    pathToFileURL(path.join(ROOT, 'src/config/mixamoAnimationCatalog.ts')).href
  );
  const spec = catalogMod.MIXAMO_ANIMATION_CATALOG.find((entry) => entry.id === 'sleeping');
  if (!spec) {
    console.error('sleeping entry missing from mixamoAnimationCatalog');
    process.exit(1);
  }

  const onDisk = new Set(
    (await import(pathToFileURL(path.join(ROOT, 'src/config/mixamoClipsOnDisk.ts')).href))
      .MIXAMO_CLIP_IDS_ON_DISK,
  );

  console.log(`Extracting KayKit sleep from ${path.relative(ROOT, args.source)}…\n`);

  const glb = extractSleepClip(args.source, KAYKIT_CLIP_NAME, CANONICAL_CLIP_NAME);
  const sourceOut = path.join(ROOT, spec.sourceRelativePath);
  const publicOut = path.join(ROOT, 'public', spec.publicUrl.replace(/^\//, ''));
  mkdirSync(path.dirname(sourceOut), { recursive: true });
  mkdirSync(path.dirname(publicOut), { recursive: true });
  writeFileSync(sourceOut, glb);
  copyFileSync(sourceOut, publicOut);
  onDisk.add('sleeping');

  writeMixamoClipIdsOnDisk(ON_DISK_MODULE, [...onDisk]);
  console.log(
    `✓ sleeping (${KAYKIT_CLIP_NAME} → ${CANONICAL_CLIP_NAME}) → ${spec.publicUrl} (${(glb.length / 1024).toFixed(0)} KB)`,
  );
  console.log(`\n✓ Updated MIXAMO_CLIP_IDS_ON_DISK (${onDisk.size} clips)`);
  console.log('  Next: npm run assets:optimize-animations && npm run assets:validate');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
