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

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const ON_DISK_MODULE = path.join(ROOT, 'src/config/mixamoClipsOnDisk.ts');
const DEFAULT_SOURCE = path.join(ROOT, 'public/models/npcs/albert.glb');

/** clipId → Quaternius clip name inside the source GLB */
const CLIP_MAP = {
  idle: 'Idle',
  walking: 'Walk',
  talking: 'Wave',
  sitting: 'Idle_Neutral',
  sleeping: 'Idle',
  working: 'Interact',
};

function parseGlb(buffer) {
  const magic = buffer.readUInt32LE(0);
  if (magic !== 0x46546c67) throw new Error('Not a GLB file');
  const version = buffer.readUInt32LE(4);
  if (version !== 2) throw new Error(`Unsupported GLB version ${version}`);

  let offset = 12;
  let json = null;
  let bin = null;

  while (offset < buffer.length) {
    const chunkLength = buffer.readUInt32LE(offset);
    const chunkType = buffer.readUInt32LE(offset + 4);
    const chunkStart = offset + 8;
    const chunkData = buffer.subarray(chunkStart, chunkStart + chunkLength);

    if (chunkType === 0x4e4f534a) {
      json = JSON.parse(chunkData.toString('utf8'));
    } else if (chunkType === 0x004e4942) {
      bin = chunkData;
    }
    offset = chunkStart + chunkLength;
  }

  if (!json) throw new Error('GLB missing JSON chunk');
  return { json, bin };
}

function buildGlb(json, bin) {
  const jsonStr = JSON.stringify(json);
  const jsonPad = (4 - (jsonStr.length % 4)) % 4;
  const jsonChunk = Buffer.from(jsonStr + ' '.repeat(jsonPad), 'utf8');

  const jsonHeader = Buffer.alloc(8);
  jsonHeader.writeUInt32LE(jsonChunk.length, 0);
  jsonHeader.writeUInt32LE(0x4e4f534a, 4);

  const chunks = [jsonHeader, jsonChunk];
  let totalLength = 12 + 8 + jsonChunk.length;

  if (bin && bin.length > 0) {
    const binPad = (4 - (bin.length % 4)) % 4;
    const binChunk = Buffer.concat([bin, Buffer.alloc(binPad)]);
    const binHeader = Buffer.alloc(8);
    binHeader.writeUInt32LE(binChunk.length, 0);
    binHeader.writeUInt32LE(0x004e4942, 4);
    chunks.push(binHeader, binChunk);
    totalLength += 8 + binChunk.length;
  }

  const header = Buffer.alloc(12);
  header.writeUInt32LE(0x46546c67, 0);
  header.writeUInt32LE(2, 4);
  header.writeUInt32LE(totalLength, 8);

  return Buffer.concat([header, ...chunks]);
}

function extractSingleAnimation(sourcePath, quaterniusName, canonicalName) {
  const buffer = readFileSync(sourcePath);
  const { json, bin } = parseGlb(buffer);
  const anim = (json.animations ?? []).find((a) => a.name === quaterniusName);
  if (!anim) {
    throw new Error(`Animation "${quaterniusName}" not found in ${path.relative(ROOT, sourcePath)}`);
  }
  const nextJson = { ...json, animations: [{ ...anim, name: canonicalName }] };
  return buildGlb(nextJson, bin);
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
