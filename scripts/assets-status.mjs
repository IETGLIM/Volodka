#!/usr/bin/env node
/**
 * Asset pipeline status — manifest, AI3DGen catalog, runtime registries.
 *
 * Usage: npm run assets:status
 */

import { existsSync, statSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const PUBLIC = path.join(ROOT, 'public');

function publicFile(url) {
  if (!url.startsWith('/')) return null;
  return path.join(PUBLIC, url.replace(/^\//, ''));
}

function fileState(url) {
  const file = publicFile(url);
  if (!file) return { ok: false, label: 'bad-url' };
  if (!existsSync(file)) return { ok: false, label: 'missing' };
  const kb = (statSync(file).size / 1024).toFixed(0);
  return { ok: true, label: `${kb} KB` };
}

async function loadModules() {
  const manifestMod = await import(pathToFileURL(path.join(ROOT, 'src/config/assetManifest.ts')).href);
  const catalogMod = await import(pathToFileURL(path.join(ROOT, 'src/config/ai3dgenAssetCatalog.ts')).href);
  const propMod = await import(pathToFileURL(path.join(ROOT, 'src/config/propModelRegistry.ts')).href);
  const npcMod = await import(pathToFileURL(path.join(ROOT, 'src/config/npcModelRegistry.ts')).href);
  return { manifestMod, catalogMod, propMod, npcMod };
}

function mark(ok) {
  return ok ? '✓' : '✗';
}

async function main() {
  const { manifestMod, catalogMod, propMod, npcMod } = await loadModules();
  const manifest = manifestMod.ASSET_MANIFEST;
  const catalog = catalogMod.AI3DGEN_ASSET_CATALOG;

  console.log('═══ Asset manifest ═══\n');
  let shippedOk = 0;
  let shippedMissing = 0;
  for (const [id, asset] of Object.entries(manifest)) {
    const shipped = asset.shipped === true;
    const lod0 = asset.lods[0]?.url;
    const state = lod0 ? fileState(lod0) : { ok: false, label: 'no-lod' };
    if (shipped) {
      if (state.ok) shippedOk += 1;
      else shippedMissing += 1;
    }
    console.log(
      `  ${shipped ? 'SHIP' : 'hold'}  ${mark(state.ok)}  ${id.padEnd(22)} ${state.label}`,
    );
  }
  console.log(`\n  Shipped on disk: ${shippedOk} ok, ${shippedMissing} missing`);

  console.log('\n═══ AI3DGen catalog ═══\n');
  let imported = 0;
  let pending = 0;
  for (const entry of catalog) {
    const sourcePath = path.join(ROOT, entry.sourceRelativePath);
    const publicState = fileState(entry.publicUrl);
    const hasSource = existsSync(sourcePath);
    if (publicState.ok) imported += 1;
    else pending += 1;
    const tier = entry.licenseTier === 'pro' ? 'Pro' : 'Free';
    console.log(
      `  ${mark(publicState.ok)} public  ${mark(hasSource)} source  [${tier}]  ${entry.id.padEnd(26)} ${entry.title}`,
    );
  }
  console.log(`\n  Imported to public/: ${imported}/${catalog.length} (${pending} pending)`);
  console.log('  Import: npm run assets:ai3dgen-import -- --id <id> --file <path>');
  console.log('  List:   npm run assets:ai3dgen-import -- --list');

  console.log('\n═══ Runtime GLB registries ═══\n');
  const propUrls = propMod.getPropModelUrls();
  const npcUrls = npcMod.getNpcModelUrls();
  let propMissing = 0;
  for (const url of propUrls) {
    const state = fileState(url);
    if (!state.ok) propMissing += 1;
    console.log(`  ${mark(state.ok)} prop  ${url}`);
  }
  let npcMissing = 0;
  for (const url of npcUrls) {
    const state = fileState(url);
    if (!state.ok) npcMissing += 1;
    console.log(`  ${mark(state.ok)} npc   ${url}`);
  }

  const fps = fileState('/models/fps/fps_arms.glb');
  console.log(`  ${mark(fps.ok)} fps   /models/fps/fps_arms.glb (${fps.label})`);

  console.log('\n═══ Next steps ═══');
  if (shippedMissing > 0 || propMissing > 0 || npcMissing > 0) {
    console.log('  npm run assets:bootstrap   # CC0 interim placeholders');
  }
  if (pending > 0) {
    console.log('  AI3DGen Pro → assets:ai3dgen-import → assets:process → flip shipped flags');
  }
  console.log('  npm run assets:validate');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
