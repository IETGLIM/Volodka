#!/usr/bin/env node
/**
 * Bootstrap production GLB assets for Vercel deploy.
 * Downloads CC0 Khronos/three.js samples and stages them at catalog paths.
 * Replace with AI3DGen Pro meshes via assets:ai3dgen-import when art is ready.
 *
 * Usage: npm run assets:bootstrap
 */
import { copyFileSync, createWriteStream, existsSync, mkdirSync, openSync, readSync, closeSync, readdirSync, statSync } from 'node:fs';
import { get as httpsGet } from 'node:https';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { spawnSync } from 'node:child_process';
import { NPC_QUATERNIUS_MAP } from './quaternius-import.mjs';
import { readMixamoClipIdsOnDisk, writeMixamoClipIdsOnDisk } from './lib/mixamoOnDisk.mjs';
import { skipKhronosBootstrap } from './lib/deployEnv.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const PUBLIC = path.join(ROOT, 'public');
const QUATERNIUS_SOURCE = path.join(ROOT, 'assets-source/ai3dgen/npcs');
const FREEKIT_INTERIORS = path.join(ROOT, 'assets-source/ai3dgen/interiors');
const MIXAMO_ON_DISK_MODULE = path.join(ROOT, 'src/config/mixamoClipsOnDisk.ts');

const KHRONOS_BASE =
  'https://raw.githubusercontent.com/KhronosGroup/glTF-Sample-Models/main/2.0';
const THREE_BASE =
  'https://raw.githubusercontent.com/mrdoob/three.js/dev/examples/models/gltf';
const THREE_SOLDIER = `${THREE_BASE}/Soldier.glb`;
const THREE_ROBOT = `${THREE_BASE}/RobotExpressive/RobotExpressive.glb`;

/** Remote URL → local path under public/ */
const REMOTE_ASSETS = {
  'models/khronos/CesiumMan.glb': `${KHRONOS_BASE}/CesiumMan/glTF-Binary/CesiumMan.glb`,
  'models/khronos/RiggedFigure.glb': `${KHRONOS_BASE}/RiggedFigure/glTF-Binary/RiggedFigure.glb`,
  'models/khronos/RiggedSimple.glb': `${KHRONOS_BASE}/RiggedSimple/glTF-Binary/RiggedSimple.glb`,
  'models/khronos/BrainStem.glb': `${KHRONOS_BASE}/BrainStem/glTF-Binary/BrainStem.glb`,
  'models/khronos/Fox.glb': `${KHRONOS_BASE}/Fox/glTF-Binary/Fox.glb`,
  'models/khronos/Avocado.glb': `${KHRONOS_BASE}/Avocado/glTF-Binary/Avocado.glb`,
  'models/khronos/Soldier.glb': THREE_SOLDIER,
  'models/khronos/Xbot.glb': `${THREE_BASE}/Xbot.glb`,
  'models/khronos/DamagedHelmet.glb': `${KHRONOS_BASE}/DamagedHelmet/glTF-Binary/DamagedHelmet.glb`,
  'models/khronos/Lantern.glb': `${KHRONOS_BASE}/Lantern/glTF-Binary/Lantern.glb`,
  'models/khronos/WaterBottle.glb': `${KHRONOS_BASE}/WaterBottle/glTF-Binary/WaterBottle.glb`,
  'models/khronos/AntiqueCamera.glb': `${KHRONOS_BASE}/AntiqueCamera/glTF-Binary/AntiqueCamera.glb`,
  'models/khronos/RobotExpressive.glb': THREE_ROBOT,
};

/**
 * Robust download with retry — fixes ECONNRESET / ETIMEDOUT on raw.githubusercontent.com
 * seen in CI (Vercel/Cloudflare). Retries 3x with exponential backoff + jitter.
 */
function download(url, dest, attempt = 1) {
  const MAX_ATTEMPTS = 3;
  const BASE_DELAY = 800;

  return new Promise((resolve, reject) => {
    mkdirSync(path.dirname(dest), { recursive: true });
    const file = createWriteStream(dest);

    const req = httpsGet(url, (response) => {
      if (response.statusCode === 301 || response.statusCode === 302) {
        const redirect = response.headers.location;
        if (!redirect) {
          file.close();
          reject(new Error(`Redirect without location: ${url}`));
          return;
        }
        file.close();
        // keep same attempt count for redirects
        download(redirect, dest, attempt).then(resolve).catch(reject);
        return;
      }
      if (response.statusCode !== 200) {
        file.close();
        const err = new Error(`HTTP ${response.statusCode} for ${url}`);
        err.code = `HTTP_${response.statusCode}`;
        reject(err);
        return;
      }
      response.pipe(file);
      file.on('finish', () => {
        file.close();
        resolve();
      });
      file.on('error', (e) => {
        file.close();
        reject(e);
      });
    });

    req.setTimeout(15000, () => {
      req.destroy(new Error(`Timeout after 15s for ${url}`));
    });

    req.on('error', (err) => {
      file.close();
      // Clean partial file
      try {
        // eslint-disable-next-line no-empty
        if (existsSync(dest)) {
          // keep partial for debug? remove to avoid glTF magic false positive
          // fs.unlinkSync(dest);
        }
      } catch {}

      const retryable = ['ECONNRESET', 'ETIMEDOUT', 'ENOTFOUND', 'EAI_AGAIN', 'ECONNREFUSED'].includes(err.code) ||
        err.message?.includes('Timeout') ||
        err.message?.includes('socket');

      if (attempt < MAX_ATTEMPTS && retryable) {
        const delay = BASE_DELAY * Math.pow(2, attempt - 1) + Math.random() * 300;
        console.warn(`  ⚠ download failed (${err.code||err.message}) attempt ${attempt}/${MAX_ATTEMPTS} — retry in ${Math.round(delay)}ms: ${url}`);
        setTimeout(() => {
          download(url, dest, attempt + 1).then(resolve).catch(reject);
        }, delay);
      } else {
        reject(err);
      }
    });
  });
}

function copyLocal(srcRel, destRel) {
  const src = path.join(PUBLIC, srcRel);
  const dest = path.join(PUBLIC, destRel);
  if (!existsSync(src)) {
    throw new Error(`Missing local source: ${srcRel}`);
  }
  mkdirSync(path.dirname(dest), { recursive: true });
  copyFileSync(src, dest);
}

function stageCopy(sourceRel, destRels) {
  for (const destRel of destRels) {
    if (shouldSkipCc0ForDest(destRel)) {
      console.log(`⊘ skip CC0 ${destRel} (RPM source present)`);
      continue;
    }
    copyLocal(sourceRel, destRel);
  }
}

/** If RPM or Quaternius source exists for this public dest, skip CC0 overwrite. */
function shouldSkipCc0ForDest(destRel) {
  for (const entry of NPC_QUATERNIUS_MAP) {
    if (!entry.publicPaths.includes(destRel)) continue;
    const src = path.join(QUATERNIUS_SOURCE, entry.source);
    if (existsSync(src)) return true;
  }
  if (!rpmCatalog) return false;
  for (const entry of rpmCatalog) {
    const pubRel = entry.publicUrl.replace(/^\//, '');
    if (pubRel !== destRel) continue;
    const src = path.join(ROOT, entry.sourceRelativePath);
    if (existsSync(src)) return true;
  }
  return false;
}

function stageQuaterniusNpcs() {
  console.log('\nStaging Quaternius NPCs (when source on disk)…');
  let staged = 0;
  for (const entry of NPC_QUATERNIUS_MAP) {
    const src = path.join(QUATERNIUS_SOURCE, entry.source);
    if (!existsSync(src)) continue;
    for (const destRel of entry.publicPaths) {
      const dest = path.join(PUBLIC, destRel);
      mkdirSync(path.dirname(dest), { recursive: true });
      copyFileSync(src, dest);
      staged += 1;
      console.log(`✓ Quaternius ${entry.source} → ${destRel}`);
    }
  }
  if (staged === 0) {
    console.log('  (no Quaternius sources — run npm run assets:quaternius-import -- --all)');
  }
}

function stageRpmNpcs() {
  if (!rpmCatalog) return;
  console.log('\nStaging Ready Player Me NPCs (when source on disk)…');
  for (const entry of rpmCatalog) {
    const src = path.join(ROOT, entry.sourceRelativePath);
    if (!existsSync(src)) continue;
    const destRel = entry.publicUrl.replace(/^\//, '');
    const dest = path.join(PUBLIC, destRel);
    mkdirSync(path.dirname(dest), { recursive: true });
    copyFileSync(src, dest);
    console.log(`✓ RPM ${entry.id} → ${destRel}`);
    if (entry.wire?.kind === 'hero') {
      for (const lodUrl of rpmHeroLods) {
        if (lodUrl === entry.publicUrl) continue;
        const lodDest = path.join(PUBLIC, lodUrl.replace(/^\//, ''));
        mkdirSync(path.dirname(lodDest), { recursive: true });
        copyFileSync(src, lodDest);
        console.log(`  ✓ hero LOD → ${lodUrl.replace(/^\//, '')}`);
      }
    }
  }
}

let rpmCatalog = null;
let rpmHeroLods = [];

async function loadRpmCatalog() {
  try {
    const mod = await import(pathToFileURL(path.join(ROOT, 'src/config/rpmNpcCatalog.ts')).href);
    rpmCatalog = mod.RPM_NPC_CATALOG;
    rpmHeroLods = mod.RPM_HERO_LOD_URLS ?? [];
  } catch {
    rpmCatalog = null;
  }
}

function hasGltfMagic(filePath) {
  const fd = openSync(filePath, 'r');
  const buf = Buffer.alloc(4);
  try {
    readSync(fd, buf, 0, 4, 0);
  } finally {
    closeSync(fd);
  }
  return buf.toString('ascii') === 'glTF';
}

async function ensureRemoteAssets() {
  if (skipKhronosBootstrap()) {
    console.log('⊘ skip Khronos download (CI/Vercel — committed GLBs used; see SKIP_KHRONOS_BOOTSTRAP)');
    return;
  }
  for (const [rel, url] of Object.entries(REMOTE_ASSETS)) {
    const dest = path.join(PUBLIC, rel);
    if (existsSync(dest) && hasGltfMagic(dest)) {
      console.log(`✓ exists ${rel}`);
      continue;
    }
    console.log(`↓ download ${rel}`);
    await download(url, dest);
    if (!hasGltfMagic(dest)) {
      throw new Error(`Downloaded file is not a valid GLB: ${rel}`);
    }
  }
}

function stageProductionLayout() {
  if (skipKhronosBootstrap()) {
    console.log('⊘ skip Khronos staging (CI/Vercel — using committed catalog GLBs)');
    return;
  }
  // Hero Volodka — single interim lod0; process-catalog builds real LOD/compression chain
  if (!existsSync(path.join(QUATERNIUS_SOURCE, 'male_01.glb'))) {
    stageCopy('models/khronos/RiggedFigure.glb', ['models/characters/volodka/volodka_lod0.glb']);
  }

  // P0/P1 NPCs — one CC0 silhouette per Quaternius preset (aliases share paths)
  stageCopy('models/khronos/RiggedFigure.glb', ['models/npcs/albert.glb', 'models/npcs/chk_ritka.glb']);
  stageCopy('models/khronos/CesiumMan.glb', ['models/npcs/zarema.glb', 'models/npcs/anya.glb']);
  stageCopy('models/khronos/Soldier.glb', ['models/npcs/cafe_barista.glb']);
  stageCopy('models/khronos/Xbot.glb', ['models/npcs/office_alexander.glb', 'models/npcs/office_dmitry.glb']);
  stageCopy('models/khronos/RiggedSimple.glb', ['models/npcs/chk_based.glb', 'models/npcs/zeka.glb']);
  stageCopy('models/khronos/RobotExpressive.glb', ['models/npcs/maria.glb']);
  // Craft / quest props — distinct CC0 meshes (no duplicate Avocado)
  stageCopy('models/khronos/Lantern.glb', ['models/props/digital_amulet.glb']);
  stageCopy('models/khronos/DamagedHelmet.glb', ['models/props/poetic_compiler.glb']);
  stageCopy('models/khronos/WaterBottle.glb', ['models/props/neural_filter.glb']);
  stageCopy('models/khronos/Avocado.glb', ['models/props/encrypted_scroll.glb']);
  stageCopy('models/khronos/AntiqueCamera.glb', ['models/props/server_fragment.glb']);

  // FPS arms — CC0 Soldier rig (replace with Drillimpact PSX arms when manually added)
  stageCopy('models/khronos/Soldier.glb', ['models/fps/fps_arms.glb']);

  // Environment / vegetation — process-catalog builds real LOD+compression from Khronos interim
}

/** Kenney interiors when present; otherwise distinct CC0 stubs per shell. */
const INTERIOR_SHELLS = [
  ['models/khronos/BrainStem.glb', 'models/interiors/room_bedroom.glb'],
  ['models/khronos/Lantern.glb', 'models/interiors/cafe_interior.glb'],
  ['models/khronos/DamagedHelmet.glb', 'models/interiors/office.glb'],
  ['models/khronos/WaterBottle.glb', 'models/interiors/library.glb'],
  ['models/khronos/AntiqueCamera.glb', 'models/interiors/factory.glb'],
  ['models/khronos/RiggedSimple.glb', 'models/interiors/corridor.glb'],
  ['models/khronos/Avocado.glb', 'models/interiors/rooftop.glb'],
  ['models/khronos/Xbot.glb', 'models/interiors/basement.glb'],
  ['models/khronos/CesiumMan.glb', 'models/interiors/pier.glb'],
  ['models/khronos/Fox.glb', 'models/interiors/forest_clearing.glb'],
];

function stageInteriorShells() {
  console.log('\nStaging interior shells…');
  let staged = 0;
  for (const [fallbackRel, destRel] of INTERIOR_SHELLS) {
    const destName = path.basename(destRel);
    const freekitSrc = path.join(FREEKIT_INTERIORS, destName);
    const dest = path.join(PUBLIC, destRel);
    mkdirSync(path.dirname(dest), { recursive: true });
    if (existsSync(freekitSrc)) {
      copyFileSync(freekitSrc, dest);
      staged += 1;
      console.log(`✓ Kenney ${destName} → ${destRel}`);
      continue;
    }
    if (skipKhronosBootstrap()) {
      if (existsSync(dest) && hasGltfMagic(dest)) {
        console.log(`⊘ skip ${destRel} (committed shell on disk)`);
        continue;
      }
      console.warn(`  ⚠ skip ${destRel} — no Kenney source and Khronos bootstrap disabled`);
      continue;
    }
    stageCopy(fallbackRel, [destRel]);
    staged += 1;
  }
  if (staged === 0) {
    console.log('  (no interior shells staged)');
  }
}

function stageInteriorTextures() {
  const candidates = [
    path.join(FREEKIT_INTERIORS, 'Textures/colormap.png'),
    path.join(ROOT, '.tmp-kenney/extract/suburban/Models/GLB format/Textures/colormap.png'),
  ];
  const src = candidates.find((p) => existsSync(p));
  if (!src) {
    console.warn('  ⚠ skip Kenney colormap — no source texture found');
    return;
  }
  for (const rel of [
    'models/interiors/Textures/colormap.png',
    'models/props/citykit/Textures/colormap.png',
  ]) {
    const dest = path.join(PUBLIC, rel);
    mkdirSync(path.dirname(dest), { recursive: true });
    copyFileSync(src, dest);
    console.log(`✓ Kenney colormap → ${rel}`);
  }
}

async function stageMixamoFromSource() {
  let catalog;
  try {
    const mod = await import(pathToFileURL(path.join(ROOT, 'src/config/mixamoAnimationCatalog.ts')).href);
    catalog = mod.MIXAMO_ANIMATION_CATALOG;
  } catch {
    return;
  }

  console.log('\nStaging Mixamo clips (when source on disk)…');
  const onDisk = readMixamoClipIdsOnDisk(MIXAMO_ON_DISK_MODULE);
  let staged = 0;

  for (const entry of catalog) {
    const src = path.join(ROOT, entry.sourceRelativePath);
    if (!existsSync(src)) continue;
    const dest = path.join(PUBLIC, entry.publicUrl.replace(/^\//, ''));
    mkdirSync(path.dirname(dest), { recursive: true });
    copyFileSync(src, dest);
    if (!onDisk.includes(entry.id)) onDisk.push(entry.id);
    staged += 1;
    console.log(`✓ Mixamo ${entry.id} → ${entry.publicUrl}`);
  }

  if (staged > 0) {
    writeMixamoClipIdsOnDisk(MIXAMO_ON_DISK_MODULE, onDisk);
  } else {
    console.log('  (no Mixamo sources — see assets-source/mixamo/README.md)');
  }
}

function stageRapierWasm() {
  console.log('\nStaging Rapier WASM for external streaming…');
  const src = path.join(ROOT, 'node_modules/@dimforge/rapier3d-compat/rapier_wasm3d_bg.wasm');
  const dest = path.join(PUBLIC, 'rapier/rapier_wasm3d_bg.wasm');
  if (!existsSync(src)) {
    console.warn('  ⚠ skip Rapier WASM — node_modules/@dimforge/rapier3d-compat not installed');
    return;
  }
  mkdirSync(path.dirname(dest), { recursive: true });
  copyFileSync(src, dest);
  const kb = (statSync(dest).size / 1024).toFixed(0);
  console.log(`✓ Rapier WASM staged: public/rapier/rapier_wasm3d_bg.wasm (${kb} KB) — external streaming enabled`);
}

function syncAssetShippedFlags() {
  console.log('\nSyncing manifest on-disk shipped flags…');
  const result = spawnSync(
    process.platform === 'win32' ? 'npx.cmd' : 'npx',
    ['tsx', '--tsconfig', 'tsconfig.json', 'scripts/sync-asset-shipped-flags.ts'],
    { cwd: ROOT, stdio: 'inherit', shell: process.platform === 'win32' },
  );
  if (result.status !== 0) {
    throw new Error('assets:sync-shipped failed');
  }
}

function reportSize() {
  let total = 0;
  const walk = (dir) => {
    for (const entry of readdirSync(dir, { withFileTypes: true })) {
      const full = path.join(dir, entry.name);
      if (entry.isDirectory()) walk(full);
      else if (entry.name.endsWith('.glb')) total += statSync(full).size;
    }
  };
  const modelsDir = path.join(PUBLIC, 'models');
  if (existsSync(modelsDir)) walk(modelsDir);
  const mb = (total / (1024 * 1024)).toFixed(1);
  console.log(`\nℹ Total GLB size under public/models/: ${mb} MB`);
}

async function main() {
  console.log('Bootstrap production assets…\n');
  await ensureRemoteAssets();
  await loadRpmCatalog();
  stageQuaterniusNpcs();
  stageRpmNpcs();
  stageProductionLayout();
  stageInteriorShells();
  stageInteriorTextures();
  await stageMixamoFromSource();
  stageRapierWasm();
  syncAssetShippedFlags();
  reportSize();
  console.log('\n✓ Production asset bootstrap complete.');
  console.log('  Optional: npm run assets:freekit-stage && npm run assets:validate');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
