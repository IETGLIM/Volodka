#!/usr/bin/env node
/**
 * Import a model downloaded from AI3DGen into the Volodka asset pipeline.
 *
 * Workflow:
 *   1. Generate on https://www.ai3dgen.com/ru/image-to-3d-model-free (OBJ free / GLB Pro)
 *   2. npm run assets:ai3dgen-import -- --id npc_albert --file ~/Downloads/model.obj
 *   3. npm run assets:process -- --input assets-source/ai3dgen/npcs/albert.glb
 *   4. Wire registries (script prints snippets) + npm run assets:validate
 *
 * Usage:
 *   node scripts/ai3dgen-import.mjs --list
 *   node scripts/ai3dgen-import.mjs --id craft_digital_amulet --file ./downloads/amulet.obj
 */

import { copyFileSync, existsSync, mkdirSync, statSync } from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath, pathToFileURL } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

function parseArgs(argv) {
  const args = { list: false, status: false, id: null, file: null };
  for (let i = 2; i < argv.length; i += 1) {
    const token = argv[i];
    if (token === '--list') args.list = true;
    else if (token === '--status') args.status = true;
    else if (token === '--id') args.id = argv[++i] ?? null;
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
  const modulePath = path.join(ROOT, 'src/config/ai3dgenAssetCatalog.ts');
  const mod = await import(pathToFileURL(modulePath).href);
  return mod;
}

function printWireInstructions(spec) {
  console.log('\n── Wire into game (manual edits) ──');
  switch (spec.wire.kind) {
    case 'npc':
      console.log(`  src/data/npcDefinitions.ts → id "${spec.wire.npcId}":`);
      console.log(`    modelPath: '${spec.publicUrl}',`);
      console.log(`  src/config/npcModelRegistry.ts → add NPC_MODEL_ASSETS.${spec.wire.npcId} + SHIPPED_NPC_GLB_URLS`);
      console.log(`  src/config/assetManifest.ts → npc_${spec.wire.npcId}: { shipped: true, lods: [{ url: '${spec.publicUrl}' }] }`);
      break;
    case 'prop':
    case 'item_prop':
      console.log(`  src/config/ai3dgenPropRegistry.ts → set shipped: true on "${spec.wire.propModelId}"`);
      console.log(`    url: '${spec.publicUrl}', scale: ${spec.defaultScale ?? 1}`);
      if (spec.wire.kind === 'item_prop') {
        console.log(`  (item id: ${spec.wire.itemId} — hook in examine/crafting UI when ready)`);
      }
      if (spec.wire.triggerZoneIds?.length) {
        console.log(`  src/data/triggerZones.ts → propModelId: '${spec.wire.propModelId}' on zones: ${spec.wire.triggerZoneIds.join(', ')}`);
      }
      break;
    case 'manifest':
      console.log(`  src/config/assetManifest.ts → ${spec.wire.assetManifestId}: set shipped: true, verify lods`);
      break;
    default:
      break;
  }
  console.log(`  public/models/ATTRIBUTION.md → AI3DGen entry (${spec.licenseTier} tier)`);
}

function printHelp() {
  console.log(`
AI3DGen import — Volodka RPG

  npm run assets:ai3dgen-import -- --list
  npm run assets:ai3dgen-import -- --status
  npm run assets:ai3dgen-import -- --id <catalog-id> --file <path-to.obj|glb>
  npm run assets:status

Generator: https://www.ai3dgen.com/ru/image-to-3d-model-free

Quaternius CC0 NPCs (rigged): npm run assets:quaternius-import -- --all
  See assets-source/ai3dgen/npcs/README.md

Notes:
  • Free tier: OBJ only, no PBR textures, personal-use license.
  • Pro tier: GLB/STL + textures; required for commercial ship.
  • AI3DGen meshes are static (no game-ready rig) — best for props/items;
    NPCs display via GltfNPCModel but won't animate until rigged.
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
    console.log('AI3DGen catalog entries:\n');
    for (const entry of catalog.AI3DGEN_ASSET_CATALOG) {
      console.log(`  ${entry.id.padEnd(28)} ${entry.title} [${entry.category}]`);
    }
    console.log('\nUpload imageBrief from catalog to AI3DGen, then import with --id.');
    console.log('Run --status to see which files are already on disk.');
    return;
  }

  if (args.status) {
    console.log('AI3DGen import status:\n');
    for (const entry of catalog.AI3DGEN_ASSET_CATALOG) {
      const sourcePath = path.join(ROOT, entry.sourceRelativePath);
      const publicPath = path.join(ROOT, 'public', entry.publicUrl.replace(/^\//, ''));
      const hasSource = existsSync(sourcePath);
      const hasPublic = existsSync(publicPath);
      const srcKb = hasSource ? ` ${(statSync(sourcePath).size / 1024).toFixed(0)} KB` : '';
      const pubKb = hasPublic ? ` ${(statSync(publicPath).size / 1024).toFixed(0)} KB` : '';
      console.log(
        `${hasPublic ? '✓' : '·'} public  ${hasSource ? '✓' : '·'} source  [${entry.licenseTier}]  ${entry.id}`,
      );
      if (hasSource || hasPublic) {
        console.log(`    source: ${path.relative(ROOT, sourcePath)}${srcKb}`);
        console.log(`    public: ${entry.publicUrl}${pubKb}`);
      }
    }
    console.log('\nFull report: npm run assets:status');
    return;
  }

  if (!args.id || !args.file) {
    printHelp();
    process.exit(1);
  }

  const spec = catalog.getAi3dgenAssetSpec(args.id);
  if (!spec) {
    console.error(`Unknown catalog id "${args.id}". Run with --list.`);
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

  if (ext === '.obj') {
    glbPath = destPath.replace(/\.glb$/i, '.glb');
    if (!glbPath.endsWith('.glb')) glbPath = `${destPath.replace(/\.[^.]+$/, '')}.glb`;
    run(
      'npx',
      ['-y', 'obj2gltf', '-i', inputPath, '-o', glbPath],
      `obj2gltf → ${path.relative(ROOT, glbPath)}`,
    );
  } else if (ext === '.glb' || ext === '.gltf') {
    copyFileSync(inputPath, destPath);
    glbPath = destPath;
    console.log(`\n✓ Copied → ${path.relative(ROOT, destPath)}`);
  } else {
    console.error('Unsupported format. Use .obj (free tier) or .glb/.gltf (Pro).');
    process.exit(1);
  }

  // Flat NPC/prop shortcut: also copy to publicUrl path for quick iteration (skip LOD pipeline)
  const publicFile = path.join(ROOT, 'public', spec.publicUrl.replace(/^\//, ''));
  mkdirSync(path.dirname(publicFile), { recursive: true });
  copyFileSync(glbPath, publicFile);
  console.log(`✓ Staged for runtime → ${path.relative(ROOT, publicFile)}`);

  console.log('\n── Next steps ──');
  console.log(`  npm run assets:process -- --input ${path.relative(ROOT, glbPath).replace(/\\/g, '/')}`);
  console.log('  npm run assets:validate');
  printWireInstructions(spec);

  if (spec.licenseTier === 'free') {
    console.log('\n⚠ Free AI3DGen tier: personal use only. Upgrade to Pro before commercial release.');
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
