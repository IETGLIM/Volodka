#!/usr/bin/env node
/**
 * Import Mixamo animation clips into the Volodka asset pipeline.
 *
 * Mixamo requires Adobe login — cannot be auto-downloaded.
 * See assets-source/mixamo/README.md for export settings.
 *
 * Usage:
 *   node scripts/mixamo-import.mjs --list
 *   node scripts/mixamo-import.mjs --status
 *   node scripts/mixamo-import.mjs --clip idle --file ./downloads/idle.glb
 *   node scripts/mixamo-import.mjs --clip walking --file ./downloads/walk.fbx
 */

import { copyFileSync, existsSync, mkdirSync, readFileSync, statSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath, pathToFileURL } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const SHIPPED_MODULE = path.join(ROOT, 'src/config/mixamoAnimationShipped.ts');

function parseArgs(argv) {
  const args = { list: false, status: false, clip: null, file: null, help: false };
  for (let i = 2; i < argv.length; i += 1) {
    const token = argv[i];
    if (token === '--list') args.list = true;
    else if (token === '--status') args.status = true;
    else if (token === '--clip') args.clip = argv[++i] ?? null;
    else if (token === '--file') args.file = argv[++i] ?? null;
    else if (token === '--help' || token === '-h') args.help = true;
  }
  return args;
}

function run(cmd, cmdArgs, label) {
  console.log(`\n▶ ${label}`);
  const result = spawnSync(cmd, cmdArgs, { stdio: 'inherit', shell: true, cwd: ROOT });
  if (result.status !== 0) {
    console.error(`✗ Failed: ${label}`);
    process.exit(result.status ?? 1);
  }
}

async function loadCatalog() {
  const modulePath = path.join(ROOT, 'src/config/mixamoAnimationCatalog.ts');
  return import(pathToFileURL(modulePath).href);
}

function readShippedIds() {
  const text = readFileSync(SHIPPED_MODULE, 'utf8');
  const match = text.match(/SHIPPED_MIXAMO_CLIP_IDS[^=]*=\s*\[([^\]]*)\]/);
  if (!match) return [];
  return match[1]
    .split(',')
    .map((s) => s.trim().replace(/['"]/g, ''))
    .filter(Boolean);
}

function writeShippedIds(ids) {
  const unique = [...new Set(ids)].sort();
  const body = `/**
 * Mixamo clips present on disk — updated by \`npm run assets:mixamo-import\`.
 * @generated — do not edit manually.
 */

import type { MixamoClipId } from './mixamoAnimationCatalog';

/** Clip ids staged under public/models/animations/ */
export const SHIPPED_MIXAMO_CLIP_IDS: readonly MixamoClipId[] = [
${unique.map((id) => `  '${id}',`).join('\n')}
];
`;
  writeFileSync(SHIPPED_MODULE, body, 'utf8');
}

function printHelp() {
  console.log(`
Mixamo import — Volodka RPG

  npm run assets:mixamo-import -- --list
  npm run assets:mixamo-import -- --status
  npm run assets:mixamo-import -- --clip <idle|walking|talking|sitting> --file <path>

Generator: https://www.mixamo.com (free Adobe ID; commercial use with account)

Export tips:
  • Upload the same T-pose rig used for your character GLB (or Mixamo auto-rig).
  • Prefer GLB download (Format: glTF Binary) with "Without Skin" for animation-only.
  • FBX works too — run through assets:process or import script converts via obj2gltf path.
  • Target 30 FPS; in-place animations; no root motion for NPC patrol.

After import:
  npm run assets:validate
  Wire: GltfNPCModel + CesiumPlayerModel load clips from public/models/animations/
`);
}

async function main() {
  const args = parseArgs(process.argv);
  if (args.help) {
    printHelp();
    return;
  }

  const catalog = await loadCatalog();

  if (args.list) {
    console.log('Mixamo animation catalog:\n');
    for (const entry of catalog.MIXAMO_ANIMATION_CATALOG) {
      console.log(`  ${entry.id.padEnd(10)} ${entry.title}`);
      console.log(`             mixamo: ${entry.mixamoSearchHint}`);
      console.log(`             public: ${entry.publicUrl}`);
    }
    console.log('\nDownload from Mixamo, then import with --clip and --file.');
    return;
  }

  if (args.status) {
    const shipped = new Set(readShippedIds());
    console.log('Mixamo import status:\n');
    for (const entry of catalog.MIXAMO_ANIMATION_CATALOG) {
      const sourcePath = path.join(ROOT, entry.sourceRelativePath);
      const publicPath = path.join(ROOT, 'public', entry.publicUrl.replace(/^\//, ''));
      const hasSource = existsSync(sourcePath);
      const hasPublic = existsSync(publicPath);
      const shippedFlag = shipped.has(entry.id);
      const srcKb = hasSource ? ` ${(statSync(sourcePath).size / 1024).toFixed(0)} KB` : '';
      const pubKb = hasPublic ? ` ${(statSync(publicPath).size / 1024).toFixed(0)} KB` : '';
      console.log(
        `${hasPublic ? '✓' : '·'} public  ${hasSource ? '✓' : '·'} source  ${shippedFlag ? '✓' : '·'} shipped  ${entry.id}`,
      );
      if (hasSource || hasPublic) {
        console.log(`    source: ${path.relative(ROOT, sourcePath)}${srcKb}`);
        console.log(`    public: ${entry.publicUrl}${pubKb}`);
      }
    }
    console.log('\nFull report: npm run assets:status');
    return;
  }

  if (!args.clip || !args.file) {
    printHelp();
    process.exit(1);
  }

  const spec = catalog.getMixamoAnimationSpec(args.clip);
  if (!spec) {
    console.error(`Unknown clip "${args.clip}". Run with --list.`);
    process.exit(1);
  }

  const inputPath = path.resolve(args.file);
  if (!existsSync(inputPath)) {
    console.error(`File not found: ${inputPath}`);
    process.exit(1);
  }

  const destPath = path.join(ROOT, spec.sourceRelativePath);
  mkdirSync(path.dirname(destPath), { recursive: true });

  const ext = path.extname(inputPath).toLowerCase();
  let glbPath = destPath;

  if (ext === '.fbx') {
    console.error(
      'FBX import: convert to GLB first (Blender File → Export → glTF, or fbx2gltf), then re-run with .glb',
    );
    console.error('  Quick path: Blender batch export, or online FBX→GLB converter.');
    process.exit(1);
  }

  if (ext === '.glb' || ext === '.gltf') {
    copyFileSync(inputPath, destPath);
    glbPath = destPath;
    console.log(`\n✓ Copied → ${path.relative(ROOT, destPath)}`);
  } else {
    console.error('Unsupported format. Use .glb/.gltf (Mixamo GLB export) or convert FBX first.');
    process.exit(1);
  }

  const publicFile = path.join(ROOT, 'public', spec.publicUrl.replace(/^\//, ''));
  mkdirSync(path.dirname(publicFile), { recursive: true });
  copyFileSync(glbPath, publicFile);
  console.log(`✓ Staged for runtime → ${path.relative(ROOT, publicFile)}`);

  const shipped = readShippedIds();
  if (!shipped.includes(spec.id)) {
    shipped.push(spec.id);
    writeShippedIds(shipped);
    console.log(`✓ Updated SHIPPED_MIXAMO_CLIP_IDS → ${spec.id}`);
  }

  console.log('\n── Next steps ──');
  console.log('  npm run assets:validate');
  console.log(`  Rename clip inside GLB to "${spec.canonicalClipName}" if needed (Blender NLA).`);
  console.log('  Retarget: Mixamo skeleton must match character rig (re-export character from Mixamo).');
  console.log('  public/models/ATTRIBUTION.md → Mixamo / Adobe entry');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
