#!/usr/bin/env node
/**
 * Download CC0 glTF sample models, Draco-compress, and install to public/models-external/.
 * Sources: Khronos glTF-Sample-Models (CC0), Three.js examples (Michelle, Soldier, Xbot).
 *
 * Usage: node scripts/fetch-cc0-models.mjs
 */

import { spawnSync } from 'node:child_process';
import { createWriteStream, existsSync, mkdirSync, renameSync, statSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { get as httpsGet } from 'node:https';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const OUT_DIR = path.join(ROOT, 'public', 'models-external');
const TMP_DIR = path.join(ROOT, 'assets-source', '_downloads');

const KHRONOS =
  'https://raw.githubusercontent.com/KhronosGroup/glTF-Sample-Models/master/2.0';

/** output filename → download URL */
const MODELS = {
  'khronos_cc0_CesiumMan.glb': `${KHRONOS}/CesiumMan/glTF-Binary/CesiumMan.glb`,
  'khronos_cc0_RiggedFigure.glb': `${KHRONOS}/RiggedFigure/glTF-Binary/RiggedFigure.glb`,
  'khronos_cc0_BrainStem.glb': `${KHRONOS}/BrainStem/glTF-Binary/BrainStem.glb`,
  'khronos_cc0_Fox.glb': `${KHRONOS}/Fox/glTF-Binary/Fox.glb`,
  'khronos_cc0_BoomBox.glb': `${KHRONOS}/BoomBox/glTF-Binary/BoomBox.glb`,
  'khronos_cc0_BoxVertexColors.glb': `${KHRONOS}/BoxVertexColors/glTF-Binary/BoxVertexColors.glb`,
  'khronos_cc0_AnimatedMorphCube.glb': `${KHRONOS}/AnimatedMorphCube/glTF-Binary/AnimatedMorphCube.glb`,
  'khronos_cc0_NormalTangentTest.glb': `${KHRONOS}/NormalTangentTest/glTF-Binary/NormalTangentTest.glb`,
  'khronos_cc0_Avocado.glb': `${KHRONOS}/Avocado/glTF-Binary/Avocado.glb`,
  'khronos_cc0_Stork.glb': `${KHRONOS}/Stork/glTF-Binary/Stork.glb`,
  'khronos_cc0_RiggedSimple.glb': `${KHRONOS}/RiggedSimple/glTF-Binary/RiggedSimple.glb`,
  'cc0_Michelle.glb': 'https://threejs.org/examples/models/gltf/Michelle.glb',
  'cc0_Soldier.glb': 'https://threejs.org/examples/models/gltf/Soldier.glb',
  'cc0_Xbot.glb': 'https://threejs.org/examples/models/gltf/Xbot.glb',
};

function download(url, dest) {
  return new Promise((resolve, reject) => {
    mkdirSync(path.dirname(dest), { recursive: true });
    const tmp = `${dest}.tmp`;
    const file = createWriteStream(tmp);
    httpsGet(url, (res) => {
      if (res.statusCode === 301 || res.statusCode === 302) {
        file.close();
        return download(res.headers.location, dest).then(resolve, reject);
      }
      if (res.statusCode !== 200) {
        reject(new Error(`HTTP ${res.statusCode} for ${url}`));
        return;
      }
      res.pipe(file);
      file.on('finish', () => {
        file.close(() => {
          renameSync(tmp, dest);
          resolve();
        });
      });
    }).on('error', reject);
  });
}

function runDraco(input, output) {
  console.log(`  draco: ${path.basename(input)} → ${path.basename(output)}`);
  const result = spawnSync(
    'npx',
    ['@gltf-transform/cli', 'draco', input, output, '--method', 'edgebreaker'],
    { stdio: 'inherit', shell: true, cwd: ROOT },
  );
  if (result.status !== 0) process.exit(result.status ?? 1);
}

mkdirSync(OUT_DIR, { recursive: true });
mkdirSync(TMP_DIR, { recursive: true });

console.log('Downloading CC0 models…\n');

for (const [filename, url] of Object.entries(MODELS)) {
  const raw = path.join(TMP_DIR, filename.replace('.glb', '_raw.glb'));
  const out = path.join(OUT_DIR, filename);

  if (existsSync(out) && statSync(out).size > 1000 && !process.argv.includes('--force')) {
    console.log(`✓ skip (exists): ${filename}`);
    continue;
  }

  console.log(`↓ ${filename}`);
  try {
    await download(url, raw);
  } catch (err) {
    console.error(`✗ download failed: ${filename} — ${err.message}`);
    continue;
  }

  try {
    runDraco(raw, out);
    const kb = (statSync(out).size / 1024).toFixed(1);
    console.log(`  ✓ ${filename} (${kb} KB draco)\n`);
  } catch {
    console.error(`  ✗ draco failed for ${filename}`);
  }
}

// ASSET_MANIFEST symlinks via copy — player / props / tree
const MANIFEST_COPIES = [
  ['khronos_cc0_RiggedFigure.glb', 'models/characters/volodka/volodka_lod0.draco.glb'],
  ['khronos_cc0_RiggedFigure.glb', 'models/characters/volodka/volodka_lod1.draco.glb'],
  ['khronos_cc0_RiggedSimple.glb', 'models/characters/volodka/volodka_lod2.draco.glb'],
  ['khronos_cc0_BoxVertexColors.glb', 'models/environments/cafe/props.draco.glb'],
  ['khronos_cc0_AnimatedMorphCube.glb', 'models/environments/cafe/props_lod0.draco.glb'],
  ['khronos_cc0_BoomBox.glb', 'models/environments/cafe/props_lod1.draco.glb'],
  ['khronos_cc0_Fox.glb', 'models/vegetation/pine/pine_lod0.draco.glb'],
  ['khronos_cc0_Fox.glb', 'models/vegetation/pine/pine_lod1.draco.glb'],
  ['khronos_cc0_RiggedSimple.glb', 'models/vegetation/pine/pine_lod2.draco.glb'],
];

console.log('Installing ASSET_MANIFEST paths…');
const { copyFileSync } = await import('node:fs');
for (const [srcName, relDest] of MANIFEST_COPIES) {
  const src = path.join(OUT_DIR, srcName);
  const dest = path.join(ROOT, 'public', relDest);
  if (!existsSync(src)) continue;
  mkdirSync(path.dirname(dest), { recursive: true });
  copyFileSync(src, dest);
  console.log(`  ${relDest}`);
}

console.log('\n✓ CC0 model fetch complete.');
console.log(`  Output: public/models-external/ (${Object.keys(MODELS).length} models)`);
