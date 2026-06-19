#!/usr/bin/env node
/**
 * Extract sit / sleep / work clips from Quaternius Universal Animation Library (CC0)
 * and retarget DEF-* bones to Ultimate Modular Character naming.
 *
 * Source: OpenGameArt Standard zip (Russia-accessible, no Adobe login)
 *   https://opengameart.org/content/universal-animation-library
 *
 * Usage:
 *   npm run assets:ual-import
 *   node scripts/extract-ual-animations.mjs --download
 *   node scripts/extract-ual-animations.mjs --source <path/to/AnimationLibrary_Godot_Standard.glb>
 */

import {
  copyFileSync,
  createWriteStream,
  existsSync,
  mkdirSync,
  readFileSync,
  statSync,
  writeFileSync,
} from 'node:fs';
import { get as httpsGet } from 'node:https';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { writeMixamoClipIdsOnDisk } from './lib/mixamoOnDisk.mjs';
import { parseGlb, buildGlb, stripAnimationGlb } from './lib/stripAnimationGlb.mjs';
import { remapGlbBoneNames } from './lib/ualToQuaterniusBoneMap.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const ON_DISK_MODULE = path.join(ROOT, 'src/config/mixamoClipsOnDisk.ts');
const DOWNLOAD_DIR = path.join(ROOT, 'assets-source/animations/_downloads');
const UAL_ZIP_URL =
  'https://opengameart.org/sites/default/files/universal_animation_librarystandard.zip';
const DEFAULT_UAL_GLB = path.join(
  DOWNLOAD_DIR,
  'ual-standard/Animation Library[Standard]/Godot/AnimationLibrary_Godot_Standard.glb',
);

/** clipId → UAL animation name inside the library GLB */
const UAL_CLIP_MAP = {
  sitting: 'Sitting_Idle_Loop',
  working: 'Fixing_Kneeling',
  /** No dedicated sleep mocap in UAL Standard — prone death is the closest lying pose */
  sleeping: 'Death01',
};

function parseArgs(argv) {
  const args = { download: false, source: DEFAULT_UAL_GLB, help: false };
  for (let i = 2; i < argv.length; i += 1) {
    const token = argv[i];
    if (token === '--download') args.download = true;
    else if (token === '--source') args.source = path.resolve(argv[++i] ?? DEFAULT_UAL_GLB);
    else if (token === '--help' || token === '-h') args.help = true;
  }
  return args;
}

function download(url, dest) {
  return new Promise((resolve, reject) => {
    mkdirSync(path.dirname(dest), { recursive: true });
    const file = createWriteStream(dest);
    httpsGet(url, (response) => {
      if (response.statusCode === 301 || response.statusCode === 302 || response.statusCode === 303) {
        const redirect = response.headers.location;
        if (!redirect) {
          reject(new Error(`Redirect without location: ${url}`));
          return;
        }
        file.close();
        download(redirect, dest).then(resolve).catch(reject);
        return;
      }
      if (response.statusCode !== 200) {
        reject(new Error(`HTTP ${response.statusCode} for ${url}`));
        return;
      }
      response.pipe(file);
      file.on('finish', () => {
        file.close();
        resolve();
      });
    }).on('error', reject);
  });
}

function extractZip(zipPath, destDir) {
  if (process.platform === 'win32') {
    spawnSync(
      'powershell',
      ['-NoProfile', '-Command', `Expand-Archive -LiteralPath '${zipPath}' -DestinationPath '${destDir}' -Force`],
      { stdio: 'inherit' },
    );
    return;
  }
  spawnSync('unzip', ['-o', zipPath, '-d', destDir], { stdio: 'inherit' });
}

async function ensureUalSource() {
  if (existsSync(DEFAULT_UAL_GLB) && statSync(DEFAULT_UAL_GLB).size > 100_000) {
    return DEFAULT_UAL_GLB;
  }

  const zipPath = path.join(DOWNLOAD_DIR, 'ual-standard.zip');
  console.log(`Downloading UAL Standard from OpenGameArt…`);
  await download(UAL_ZIP_URL, zipPath);
  console.log('Extracting…');
  extractZip(zipPath, path.join(DOWNLOAD_DIR, 'ual-standard'));

  if (!existsSync(DEFAULT_UAL_GLB)) {
    throw new Error(`Expected GLB missing after extract: ${path.relative(ROOT, DEFAULT_UAL_GLB)}`);
  }
  return DEFAULT_UAL_GLB;
}

function extractSingleAnimation(sourcePath, ualName, canonicalName) {
  const buffer = readFileSync(sourcePath);
  const { json, bin } = parseGlb(buffer);
  const anim = (json.animations ?? []).find((a) => a.name === ualName);
  if (!anim) {
    const available = (json.animations ?? []).map((a) => a.name).sort().join(', ');
    throw new Error(
      `Animation "${ualName}" not found in ${path.relative(ROOT, sourcePath)}. Available: ${available}`,
    );
  }

  const remapped = remapGlbBoneNames(json);
  const nextJson = { ...remapped, animations: [{ ...anim, name: canonicalName }] };
  return stripAnimationGlb(buildGlb(nextJson, bin));
}

function printHelp() {
  console.log(`
UAL animation import — Volodka RPG (CC0, no Adobe login)

  npm run assets:ual-import
  node scripts/extract-ual-animations.mjs --download

Overrides sit/sleep/work clips only (idle/walk/talk stay on modular Quaternius extract):
  sitting  ← Sitting_Idle_Loop
  working  ← Fixing_Kneeling
  sleeping ← Death01 (prone; true sleep mocap still needs Mixamo/KayKit manual import)

Source: ${UAL_ZIP_URL}
`);
}

async function main() {
  const args = parseArgs(process.argv);
  if (args.help) {
    printHelp();
    return;
  }

  const sourcePath = args.download || !existsSync(args.source)
    ? await ensureUalSource()
    : args.source;

  if (!existsSync(sourcePath)) {
    console.error(`Source GLB not found: ${sourcePath}`);
    console.error('Run with --download or place UAL Godot GLB at the default path.');
    process.exit(1);
  }

  const catalogMod = await import(
    pathToFileURL(path.join(ROOT, 'src/config/mixamoAnimationCatalog.ts')).href
  );
  const catalog = catalogMod.MIXAMO_ANIMATION_CATALOG;
  const onDisk = new Set(
    (await import(pathToFileURL(path.join(ROOT, 'src/config/mixamoClipsOnDisk.ts')).href))
      .MIXAMO_CLIP_IDS_ON_DISK,
  );

  console.log(`Extracting UAL animations from ${path.relative(ROOT, sourcePath)}…\n`);

  for (const entry of catalog) {
    const ualName = UAL_CLIP_MAP[entry.id];
    if (!ualName) continue;

    const glb = extractSingleAnimation(sourcePath, ualName, entry.canonicalClipName);
    const sourceDir = path.join(ROOT, entry.sourceRelativePath);
    const publicDir = path.join(ROOT, 'public', entry.publicUrl.replace(/^\//, ''));
    mkdirSync(path.dirname(sourceDir), { recursive: true });
    mkdirSync(path.dirname(publicDir), { recursive: true });
    writeFileSync(sourceDir, glb);
    copyFileSync(sourceDir, publicDir);
    onDisk.add(entry.id);
    console.log(
      `✓ ${entry.id} (${ualName} → ${entry.canonicalClipName}) → ${entry.publicUrl} (${(glb.length / 1024).toFixed(0)} KB)`,
    );
  }

  writeMixamoClipIdsOnDisk(ON_DISK_MODULE, [...onDisk]);
  console.log(`\n✓ Updated MIXAMO_CLIP_IDS_ON_DISK (${onDisk.size} clips)`);
  console.log('  Next: npm run assets:optimize-animations && npm run assets:validate');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
