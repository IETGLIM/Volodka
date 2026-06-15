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
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const PUBLIC = path.join(ROOT, 'public');

const KHRONOS_BASE =
  'https://raw.githubusercontent.com/KhronosGroup/glTF-Sample-Models/main/2.0';
const THREE_SOLDIER =
  'https://raw.githubusercontent.com/mrdoob/three.js/dev/examples/models/gltf/Soldier.glb';

/** Remote URL → local path under public/ */
const REMOTE_ASSETS = {
  'models/khronos/CesiumMan.glb': `${KHRONOS_BASE}/CesiumMan/glTF-Binary/CesiumMan.glb`,
  'models/khronos/RiggedFigure.glb': `${KHRONOS_BASE}/RiggedFigure/glTF-Binary/RiggedFigure.glb`,
  'models/khronos/RiggedSimple.glb': `${KHRONOS_BASE}/RiggedSimple/glTF-Binary/RiggedSimple.glb`,
  'models/khronos/BrainStem.glb': `${KHRONOS_BASE}/BrainStem/glTF-Binary/BrainStem.glb`,
  'models/khronos/Fox.glb': `${KHRONOS_BASE}/Fox/glTF-Binary/Fox.glb`,
  'models/khronos/Avocado.glb': `${KHRONOS_BASE}/Avocado/glTF-Binary/Avocado.glb`,
  'models/khronos/Soldier.glb': THREE_SOLDIER,
};

function download(url, dest) {
  return new Promise((resolve, reject) => {
    mkdirSync(path.dirname(dest), { recursive: true });
    const file = createWriteStream(dest);
    httpsGet(url, (response) => {
      if (response.statusCode === 301 || response.statusCode === 302) {
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
    copyLocal(sourceRel, destRel);
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
  // Hero Volodka — interim CC0 CesiumMan LOD chain (replace after Blender rig pass)
  const heroBase = 'models/khronos/CesiumMan.glb';
  stageCopy(heroBase, [
    'models/characters/volodka/volodka_lod0.glb',
    'models/characters/volodka/volodka_lod1.glb',
    'models/characters/volodka/volodka_lod2.glb',
    'models/characters/volodka/volodka_lod0.draco.glb',
    'models/characters/volodka/volodka_lod0.meshopt.glb',
  ]);

  // P0 NPCs
  stageCopy('models/khronos/CesiumMan.glb', ['models/npcs/albert.glb']);
  stageCopy('models/khronos/RiggedFigure.glb', ['models/npcs/zarema.glb']);

  // P1 NPCs — distinct CC0 silhouettes until AI3DGen Pro drops land
  stageCopy('models/npcs/cafe_barista.glb', ['models/npcs/maria.glb']);
  stageCopy('models/khronos/BrainStem.glb', ['models/npcs/office_alexander.glb']);
  stageCopy('models/khronos/CesiumMan.glb', ['models/npcs/office_dmitry.glb']);
  stageCopy('models/khronos/Soldier.glb', ['models/npcs/viktor.glb']);
  stageCopy('models/khronos/RiggedFigure.glb', ['models/npcs/kira.glb']);
  stageCopy('models/khronos/RiggedSimple.glb', ['models/npcs/boris.glb']);
  stageCopy('models/khronos/RiggedSimple.glb', ['models/npcs/tamara.glb']);
  stageCopy('models/khronos/Fox.glb', ['models/npcs/grisha.glb']);

  // Craft / quest props — small CC0 prop placeholder
  const propPaths = [
    'models/props/digital_amulet.glb',
    'models/props/poetic_compiler.glb',
    'models/props/neural_filter.glb',
    'models/props/encrypted_scroll.glb',
    'models/props/server_fragment.glb',
  ];
  stageCopy('models/khronos/Avocado.glb', propPaths);

  // FPS arms — CC0 Soldier rig (replace with Drillimpact PSX arms when manually added)
  stageCopy('models/khronos/Soldier.glb', ['models/fps/fps_arms.glb']);

  // Environment bundles — interim CC0 until AI3DGen / art pass (see env_cafe_props, veg_tree_pine)
  stageCopy('models/khronos/BrainStem.glb', [
    'models/environments/cafe/props_lod0.glb',
    'models/environments/cafe/props_lod1.glb',
    'models/environments/cafe/props.draco.glb',
    'models/environments/cafe/props.meshopt.glb',
  ]);
  stageCopy('models/khronos/Avocado.glb', [
    'models/vegetation/pine/pine_lod0.glb',
    'models/vegetation/pine/pine_lod1.glb',
    'models/vegetation/pine/pine_lod2.glb',
  ]);
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
  stageProductionLayout();
  reportSize();
  console.log('\n✓ Production asset bootstrap complete.');
  console.log('  Next: npm run assets:validate');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
