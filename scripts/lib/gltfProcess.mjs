/**
 * Shared GLTF processing — optimize, Draco, Meshopt, LOD simplify.
 * Used by process-gltf-assets.mjs and process-catalog-assets.mjs.
 */

import { spawnSync } from 'node:child_process';
import { existsSync, mkdirSync, renameSync, unlinkSync } from 'node:fs';
import path from 'node:path';

/**
 * Output naming layouts:
 * - suffix-lod: {base}_lod0.glb, {base}_lod1.glb, {base}.draco.glb
 * - hero-lod:   volodka-style — draco/meshopt on lod0 stem
 * - npc-flat:   {base}.glb (lod0), {base}_lod1.glb, {base}.draco.glb
 * - single:     one mesh + optional draco/meshopt (interiors)
 */
export const GLTF_OUTPUT_LAYOUTS = ['suffix-lod', 'hero-lod', 'npc-flat', 'single'];

/**
 * @param {string} layout
 * @param {string} outBase absolute path without extension
 */
export function resolveOutputPaths(layout, outBase) {
  switch (layout) {
    case 'hero-lod':
      return {
        lod0: `${outBase}_lod0.glb`,
        lod1: `${outBase}_lod1.glb`,
        lod2: `${outBase}_lod2.glb`,
        draco: `${outBase}_lod0.draco.glb`,
        meshopt: `${outBase}_lod0.meshopt.glb`,
      };
    case 'npc-flat':
      return {
        lod0: `${outBase}.glb`,
        lod1: `${outBase}_lod1.glb`,
        lod2: `${outBase}_lod2.glb`,
        draco: `${outBase}.draco.glb`,
        meshopt: `${outBase}.meshopt.glb`,
      };
    case 'single':
      return {
        lod0: `${outBase}.glb`,
        lod1: null,
        lod2: null,
        draco: `${outBase}.draco.glb`,
        meshopt: `${outBase}.meshopt.glb`,
      };
    case 'suffix-lod':
    default:
      return {
        lod0: `${outBase}_lod0.glb`,
        lod1: `${outBase}_lod1.glb`,
        lod2: `${outBase}_lod2.glb`,
        draco: `${outBase}.draco.glb`,
        meshopt: `${outBase}.meshopt.glb`,
      };
  }
}

export function runGltfTransform(cwd, args, label, { exitOnFail = true } = {}) {
  console.log(`\n▶ ${label}`);
  const result = spawnSync('npx', ['-y', '@gltf-transform/cli', ...args], {
    stdio: 'inherit',
    shell: true,
    cwd,
  });
  if (result.status !== 0) {
    const message = `✗ Failed: ${label}`;
    if (exitOnFail) {
      console.error(message);
      process.exit(result.status ?? 1);
    }
    console.warn(message);
    return false;
  }
  return true;
}

/**
 * @param {object} options
 * @param {string} options.root repo root
 * @param {string} options.srcPath absolute input GLB
 * @param {string} options.outBase absolute output path without extension
 * @param {string} [options.layout]
 * @param {boolean} [options.skipLod]
 * @param {boolean} [options.skipCompression]
 * @param {boolean} [options.exitOnFail]
 */
export function processGltfAsset({
  root,
  srcPath,
  outBase,
  layout = 'suffix-lod',
  skipLod = false,
  skipCompression = false,
  exitOnFail = true,
}) {
  if (!existsSync(srcPath)) {
    const message = `✗ Missing source: ${srcPath}`;
    if (exitOnFail) {
      console.error(message);
      process.exit(1);
    }
    console.warn(message);
    return false;
  }

  mkdirSync(path.dirname(outBase), { recursive: true });
  const paths = resolveOutputPaths(layout, outBase);
  const rel = (file) => path.relative(root, file);

  runGltfTransform(root, ['copy', srcPath, paths.lod0], `copy → ${rel(paths.lod0)}`, { exitOnFail });

  const optimizedTmp = `${paths.lod0}.optimized.tmp.glb`;
  runGltfTransform(
    root,
    ['optimize', paths.lod0, optimizedTmp, '--texture-compress', 'false'],
    `optimize → ${rel(paths.lod0)}`,
    { exitOnFail },
  );
  try {
    if (existsSync(paths.lod0)) unlinkSync(paths.lod0);
    renameSync(optimizedTmp, paths.lod0);
  } catch (err) {
    console.error(`✗ Failed to finalize optimize: ${paths.lod0}`, err);
    if (exitOnFail) process.exit(1);
    return false;
  }

  if (!skipCompression) {
    runGltfTransform(root, ['draco', paths.lod0, paths.draco], `draco → ${rel(paths.draco)}`, { exitOnFail });
    runGltfTransform(
      root,
      ['meshopt', paths.lod0, paths.meshopt],
      `meshopt → ${rel(paths.meshopt)}`,
      { exitOnFail },
    );
  }

  if (!skipLod && paths.lod1 && paths.lod2) {
    runGltfTransform(
      root,
      ['simplify', paths.lod0, paths.lod1, '--ratio', '0.5', '--error', '0.01'],
      `lod1 → ${rel(paths.lod1)}`,
      { exitOnFail },
    );
    runGltfTransform(
      root,
      ['simplify', paths.lod0, paths.lod2, '--ratio', '0.2', '--error', '0.02'],
      `lod2 → ${rel(paths.lod2)}`,
      { exitOnFail },
    );
  }

  return true;
}
