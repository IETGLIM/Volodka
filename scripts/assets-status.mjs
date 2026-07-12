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
  const mixamoMod = await import(pathToFileURL(path.join(ROOT, 'src/config/mixamoAnimationCatalog.ts')).href);
  const mixamoOnDiskMod = await import(pathToFileURL(path.join(ROOT, 'src/config/mixamoClipsOnDisk.ts')).href);
  const rpmMod = await import(pathToFileURL(path.join(ROOT, 'src/config/rpmNpcCatalog.ts')).href);
  const rpmOnDiskMod = await import(pathToFileURL(path.join(ROOT, 'src/config/rpmNpcOnDisk.generated.ts')).href);
  const quaterniusMod = await import(pathToFileURL(path.join(ROOT, 'scripts/quaternius-import.mjs')).href);
  const propMod = await import(pathToFileURL(path.join(ROOT, 'src/config/propModelRegistry.ts')).href);
  const npcMod = await import(pathToFileURL(path.join(ROOT, 'src/config/npcModelRegistry.ts')).href);
  return { manifestMod, catalogMod, mixamoMod, mixamoOnDiskMod, rpmMod, rpmOnDiskMod, quaterniusMod, propMod, npcMod };
}

function mark(ok) {
  return ok ? '✓' : '✗';
}

async function main() {
  const { manifestMod, catalogMod, mixamoMod, mixamoOnDiskMod, rpmMod, rpmOnDiskMod, quaterniusMod, propMod, npcMod } = await loadModules();
  const manifest = manifestMod.ASSET_MANIFEST;
  const catalog = catalogMod.AI3DGEN_ASSET_CATALOG;
  const mixamoCatalog = mixamoMod.MIXAMO_ANIMATION_CATALOG;
  const onDiskMixamo = new Set(mixamoOnDiskMod.MIXAMO_CLIP_IDS_ON_DISK);

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

  console.log('\n═══ Mixamo animations ═══\n');
  let mixamoImported = 0;
  let mixamoPending = 0;
  for (const entry of mixamoCatalog) {
    const sourcePath = path.join(ROOT, entry.sourceRelativePath);
    const publicState = fileState(entry.publicUrl);
    const hasSource = existsSync(sourcePath);
    const onDisk = onDiskMixamo.has(entry.id);
    if (publicState.ok && onDisk) mixamoImported += 1;
    else mixamoPending += 1;
    console.log(
      `  ${mark(publicState.ok)} public  ${mark(hasSource)} source  ${onDisk ? 'DISK' : 'hold'}  ${entry.id.padEnd(10)} ${entry.title}`,
    );
  }
  console.log(`\n  On-disk Mixamo clips: ${mixamoImported}/${mixamoCatalog.length} (${mixamoPending} pending)`);
  console.log('  Import: npm run assets:mixamo-import -- --clip <id> --file <path>');
  console.log('  Guide:  assets-source/mixamo/README.md');

  console.log('\n═══ RPM NPC catalog (Ready Player Me) ═══\n');
  let rpmSource = 0;
  let rpmPublic = 0;
  for (const entry of rpmMod.RPM_NPC_CATALOG) {
    const sourcePath = path.join(ROOT, entry.sourceRelativePath);
    const publicState = fileState(entry.publicUrl);
    const hasSource = existsSync(sourcePath);
    if (hasSource) rpmSource += 1;
    if (publicState.ok) rpmPublic += 1;
    console.log(
      `  ${mark(publicState.ok)} public  ${mark(hasSource)} source  ${entry.id.padEnd(22)} → ${entry.npcId}`,
    );
  }
  console.log(
    `\n  Source on disk: ${rpmSource}/${rpmMod.RPM_NPC_CATALOG.length} · public: ${rpmPublic} · on-disk registry: ${rpmOnDiskMod.RPM_NPC_GLB_URLS_ON_DISK.length}`,
  );
  console.log('  Import: npm run assets:rpm-import -- --id <id> --file <path>');
  console.log('  List:   npm run assets:rpm-import -- --list');
  console.log('  Guide:  assets-source/ai3dgen/npcs/README.md');

  console.log('\n═══ Quaternius NPC catalog (CC0) ═══\n');
  let quaterniusSource = 0;
  let quaterniusPublic = 0;
  for (const entry of quaterniusMod.NPC_QUATERNIUS_MAP) {
    const sourcePath = path.join(ROOT, 'assets-source/ai3dgen/npcs', entry.source);
    const primary = `/${entry.publicPaths[0]}`;
    const publicState = fileState(primary);
    const hasSource = existsSync(sourcePath);
    if (hasSource) quaterniusSource += 1;
    if (publicState.ok) quaterniusPublic += 1;
    console.log(
      `  ${mark(publicState.ok)} public  ${mark(hasSource)} source  ${entry.source.padEnd(14)} → ${entry.npcId ?? 'hero'}`,
    );
  }
  console.log(
    `\n  Source on disk: ${quaterniusSource}/${quaterniusMod.NPC_QUATERNIUS_MAP.length} · public primary: ${quaterniusPublic}`,
  );
  console.log('  Import: npm run assets:quaternius-import -- --all');
  console.log('  Status: npm run assets:quaternius-import -- --status');

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

  const proCatalog = catalog.filter((entry) => entry.licenseTier === 'pro');
  const proSourceOnDisk = proCatalog.filter((entry) =>
    existsSync(path.join(ROOT, entry.sourceRelativePath)),
  ).length;
  const registryOk = propMissing === 0 && npcMissing === 0 && fps.ok;
  const quaterniusOk =
    quaterniusSource === quaterniusMod.NPC_QUATERNIUS_MAP.length
    && quaterniusPublic === quaterniusMod.NPC_QUATERNIUS_MAP.length;
  const mixamoOk = mixamoPending === 0;
  const rpmSourceOk = rpmSource === rpmMod.RPM_NPC_CATALOG.length;

  console.log('\n═══ Sprint 2 audit (ROADMAP §8) ═══\n');
  console.log(`  ${mark(shippedMissing === 0)}  Manifest shipped GLBs     ${shippedOk}/${shippedOk + shippedMissing} on disk`);
  console.log(`  ${mark(registryOk)}  Runtime prop/NPC/fps registries   ${propUrls.length + npcUrls.length + 1} URLs`);
  console.log(
    `  ${mark(quaterniusOk)}  Quaternius CC0 NPCs (interim)   ${quaterniusPublic}/${quaterniusMod.NPC_QUATERNIUS_MAP.length} public · embedded idle/walk/talk via npcClipResolution`,
  );
  console.log(
    `  ${mark(mixamoOk)}  Mixamo clip overrides           ${mixamoImported}/${mixamoCatalog.length} shipped (Adobe login)`,
  );
  console.log(
    `  ${mark(rpmSourceOk)}  RPM story NPC source GLBs       ${rpmSource}/${rpmMod.RPM_NPC_CATALOG.length} (Ready Player Me export)`,
  );
  console.log(
    `  ${mark(proSourceOnDisk === proCatalog.length)}  AI3DGen Pro source meshes      ${proSourceOnDisk}/${proCatalog.length} (public CC0 interim OK)`,
  );
  if (!mixamoOk || !rpmSourceOk || proSourceOnDisk < proCatalog.length) {
    console.log('\n  Blockers: Mixamo + RPM need manual auth downloads; Pro meshes are optional visual upgrade.');
    console.log('  Interim path: Quaternius embedded clips + assets:validate green until Mixamo lands.');
  }

  console.log('\n═══ Next steps ═══');
  if (shippedMissing > 0 || propMissing > 0 || npcMissing > 0) {
    console.log('  npm run assets:bootstrap   # CC0 interim placeholders');
  }
  if (pending > 0) {
    console.log('  AI3DGen Pro → assets:ai3dgen-import → assets:process → flip shipped flags');
  }
  if (mixamoPending > 0) {
    console.log('  Mixamo → assets:mixamo-import (Adobe login) → assets:validate');
  }
  if (rpmMod.RPM_NPC_CATALOG.length - rpmSource > 0) {
    console.log('  RPM → assets:rpm-import (Ready Player Me login) → assets:validate');
  }
  if (quaterniusMod.NPC_QUATERNIUS_MAP.length - quaterniusSource > 0) {
    console.log('  Quaternius → assets:quaternius-import -- --all → assets:validate');
  }
  console.log('  npm run assets:validate');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
