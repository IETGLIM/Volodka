#!/usr/bin/env node
/**
 * Download selected Poly Haven CC0 glTF model payloads into public/models.
 *
 * Poly Haven exposes a per-asset manifest with the .gltf, .bin, and texture
 * files. Keep the runtime paths stable by mapping each asset to its expected
 * local .gltf filename.
 */
import { createWriteStream, existsSync, mkdirSync, statSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { get as httpsGet } from 'node:https';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const POLYHAVEN_DIR = path.join(ROOT, 'public', 'models', 'polyhaven');
const API_BASE = 'https://api.polyhaven.com/files';

const ASSETS = [
  // Existing authored street/plaza references; repair missing bins/textures.
  ['modular_urban_apartments_facade', 'modular_urban_apartments_facade.gltf', '2k'],
  ['modular_fire_escape', 'modular_fire_escape.gltf', '2k'],
  ['concrete_road_barrier', 'concrete_road_barrier.gltf', '2k'],
  ['painted_wooden_bench', 'painted_wooden_bench.gltf', '2k'],
  ['hanging_industrial_lamp', 'hanging_industrial_lamp.gltf', '2k'],
  ['rollershutter_window_01', 'rollershutter_window_01.gltf', '2k'],
  ['Barrel_01', 'Barrel_01.gltf', '2k'],
  ['cardboard_box_01', 'cardboard_box_01_1k.gltf', '1k'],
  ['metal_trash_can', 'metal_trash_can_1k.gltf', '1k'],
  ['street_lamp_01', 'street_lamp_01_1k.gltf', '1k'],
  ['trashbag', 'trashbag_1k.gltf', '1k'],
  ['WetFloorSign_01', 'WetFloorSign_01_1k.gltf', '1k'],
  ['rollershutter_door', 'rollershutter_door_1k.gltf', '1k'],

  // Higher-fidelity street/interior upgrades.
  ['gothic_statue', 'gothic_statue_2k.gltf', '2k'],
  ['street_lamp_02', 'street_lamp_02_1k.gltf', '1k'],
  ['concrete_road_barrier_02', 'concrete_road_barrier_02_1k.gltf', '1k'],
  ['rollershutter_window_02', 'rollershutter_window_02_1k.gltf', '1k'],
  ['exterior_aircon_unit', 'exterior_aircon_unit_1k.gltf', '1k'],
  ['power_box_01', 'power_box_01_1k.gltf', '1k'],
  ['security_camera_01', 'security_camera_01_1k.gltf', '1k'],
  ['utility_box_01', 'utility_box_01_1k.gltf', '1k'],
  ['old_tyre', 'old_tyre_1k.gltf', '1k'],
  ['water_manhole_cover', 'water_manhole_cover_1k.gltf', '1k'],
  ['wooden_crate_01', 'wooden_crate_01_1k.gltf', '1k'],
  ['ArmChair_01', 'ArmChair_01_2k.gltf', '2k'],
  ['painted_wooden_table', 'painted_wooden_table_2k.gltf', '2k'],
  ['painted_wooden_cabinet', 'painted_wooden_cabinet_2k.gltf', '2k'],
  ['wooden_bookshelf_worn', 'wooden_bookshelf_worn_2k.gltf', '2k'],
  ['desk_lamp_arm_01', 'desk_lamp_arm_01_2k.gltf', '2k'],
  ['sofa_02', 'sofa_02_2k.gltf', '2k'],
  ['portable_cassette_player', 'portable_cassette_player_1k.gltf', '1k'],
];

function requestJson(url) {
  return fetch(url).then((response) => {
    if (!response.ok) throw new Error(`HTTP ${response.status} for ${url}`);
    return response.json();
  });
}

function download(url, dest, expectedSize) {
  return new Promise((resolve, reject) => {
    if (existsSync(dest) && (!expectedSize || statSync(dest).size === expectedSize)) {
      resolve(false);
      return;
    }
    mkdirSync(path.dirname(dest), { recursive: true });
    const file = createWriteStream(dest);
    httpsGet(url, (response) => {
      if (response.statusCode === 301 || response.statusCode === 302) {
        file.close();
        const redirect = response.headers.location;
        if (!redirect) {
          reject(new Error(`Redirect without location: ${url}`));
          return;
        }
        download(redirect, dest, expectedSize).then(resolve).catch(reject);
        return;
      }
      if (response.statusCode !== 200) {
        reject(new Error(`HTTP ${response.statusCode} for ${url}`));
        return;
      }
      response.pipe(file);
      file.on('finish', () => {
        file.close(() => resolve(true));
      });
    }).on('error', reject);
  });
}

function resolveGltfEntry(files, preferredRes) {
  const gltfFiles = files.gltf;
  if (!gltfFiles) return null;
  for (const res of [preferredRes, '2k', '1k', '4k']) {
    const entry = gltfFiles[res]?.gltf;
    if (entry) return entry;
  }
  return null;
}

async function downloadAsset(assetId, targetFile, preferredRes) {
  const files = await requestJson(`${API_BASE}/${assetId}`);
  const entry = resolveGltfEntry(files, preferredRes);
  if (!entry) throw new Error(`No glTF entry for ${assetId}`);

  const assetDir = path.join(POLYHAVEN_DIR, assetId);
  let changed = 0;
  const mainChanged = await download(entry.url, path.join(assetDir, targetFile), entry.size);
  if (mainChanged) changed += 1;

  for (const [includePath, includeEntry] of Object.entries(entry.include ?? {})) {
    const includeChanged = await download(
      includeEntry.url,
      path.join(assetDir, includePath),
      includeEntry.size,
    );
    if (includeChanged) changed += 1;
  }

  console.log(`${changed > 0 ? '↓' : '✓'} ${assetId} (${preferredRes}) → ${path.relative(ROOT, assetDir)}`);
  return changed;
}

async function main() {
  mkdirSync(POLYHAVEN_DIR, { recursive: true });
  let changed = 0;
  for (const [assetId, targetFile, preferredRes] of ASSETS) {
    changed += await downloadAsset(assetId, targetFile, preferredRes);
  }
  console.log(`\n✓ Poly Haven model download complete (${changed} file(s) updated).`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
