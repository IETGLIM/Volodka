/**
 * Shared GLTF processing — optimize, Draco, Meshopt, LOD simplify.
 * Used by process-gltf-assets.mjs and process-catalog-assets.mjs.
 *
 * Best practices applied:
 * - Uses locally-installed @gltf-transform/cli (pinned version) instead of `npx -y`
 *   to prevent supply-chain breakage on major version bumps.
 * - KTX2/Basis ETC1S texture compression applied to Draco variant via separate
 *   `etc1s` pass, significantly reducing texture sizes for low/medium/high quality
 *   tiers (60-75% smaller textures with minimal visual quality loss).
 * - Meshopt variants keep original textures (meshopt decompresses geometry only;
 *   KTX2 transcoding overhead not justified when GPU is already strong enough for ultra).
 * - Pipeline order: copy → optimize → draco → etc1s → meshopt → LOD generation.
 *
 * LOD Strategy (v2 — asset-aware):
 * - Static meshes (suffix-lod): weld + simplify with relaxed error thresholds.
 *   Weld merges split vertices for cross-submesh simplification.
 * - Skinned meshes (hero-lod, npc-flat): geometry LOD is ineffective for
 *   multi-part skinned characters (simplify can't reduce small submeshes).
 *   Instead, LOD1/LOD2 use Draco+texture-resize (50%/25% texture scale).
 *   This provides bandwidth savings while keeping animation-compatible geometry.
 *   Distant rendering uses impostor billboard (see assetManifest.impostor).
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

/**
 * Resolve the local @gltf-transform/cli binary path.
 * Uses the pinned devDependency instead of `npx -y` to prevent
 * supply-chain breakage on unpinned major version bumps.
 */
function resolveGltfTransformBin(root) {
  const localBin = path.join(root, 'node_modules', '.bin', 'gltf-transform');
  if (existsSync(localBin)) return localBin;
  // Fallback to npx if local install is missing (CI without devDeps, etc.)
  console.warn('⚠ Local @gltf-transform/cli not found — falling back to npx -y (unpinned).');
  return null;
}

export function runGltfTransform(cwd, args, label, { exitOnFail = true } = {}) {
  console.log(`\n▶ ${label}`);
  const localBin = resolveGltfTransformBin(cwd);
  const cmd = localBin ? localBin : 'npx';
  const cmdArgs = localBin ? args : ['-y', '@gltf-transform/cli', ...args];
  const result = spawnSync(cmd, cmdArgs, {
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
 * @param {boolean} [options.skipTextureCompress] Skip KTX2/Basis texture compression for Draco variant
 * @param {boolean} [options.exitOnFail]
 */
export function processGltfAsset({
  root,
  srcPath,
  outBase,
  layout = 'suffix-lod',
  skipLod = false,
  skipCompression = false,
  skipTextureCompress = false,
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

  // Step 1: Copy source → lod0 baseline (no compression, original textures preserved)
  runGltfTransform(root, ['copy', srcPath, paths.lod0], `copy → ${rel(paths.lod0)}`, { exitOnFail });

  // Step 2: Optimize — dedup, weld, resample, prune unused.
  // For the baseline (lod0), keep original textures (PNG/JPEG) since this
  // is the high-quality path used at lod0 distance and by meshopt variant.
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
    // Step 3a: Draco variant — compress geometry only.
    // KTX2 texture compression is applied separately via `etc1s` pass below.
    runGltfTransform(root, ['draco', paths.lod0, paths.draco], `draco → ${rel(paths.draco)}`, { exitOnFail });

    // Step 3b: KTX2/Basis ETC1S texture compression on the Draco variant.
    // ETC1S offers 60-75% texture size reduction with minimal visual quality loss.
    // GPU-native transcoding avoids runtime decompression overhead on all modern GPUs.
    // This targets low/medium/high quality tiers where bandwidth savings matter most.
    // Note: Requires KTX-Software installed on the build machine.
    if (!skipTextureCompress) {
      const dracoKtx2Tmp = `${paths.draco}.ktx2.tmp.glb`;
      const etc1sOk = runGltfTransform(
        root,
        ['etc1s', paths.draco, dracoKtx2Tmp, '--quality', '192', '--compression', '1', '--jobs', '4'],
        `ktx2 etc1s → ${rel(paths.draco)}`,
        { exitOnFail: false }, // non-fatal: KTX-Software may not be installed
      );
      if (etc1sOk && existsSync(dracoKtx2Tmp)) {
        try {
          if (existsSync(paths.draco)) unlinkSync(paths.draco);
          renameSync(dracoKtx2Tmp, paths.draco);
        } catch (err) {
          console.warn(`⚠ Failed to finalize KTX2 Draco: ${err.message}`);
          // Keep the Draco-only file as fallback
          if (existsSync(dracoKtx2Tmp)) unlinkSync(dracoKtx2Tmp);
        }
      } else if (existsSync(dracoKtx2Tmp)) {
        unlinkSync(dracoKtx2Tmp);
      }
    }

    // Step 3c: Meshopt variant — geometry-only compression for ultra tier.
    // Meshopt decompresses on the main thread (fast with SIMD), and ultra-tier
    // GPUs handle full-resolution textures natively — KTX2 not justified here.
    runGltfTransform(
      root,
      ['meshopt', paths.lod0, paths.meshopt],
      `meshopt → ${rel(paths.meshopt)}`,
      { exitOnFail },
    );
  }

  const isSkinned = layout === 'hero-lod' || layout === 'npc-flat';

  if (!skipLod && paths.lod1 && paths.lod2) {
    if (isSkinned) {
      // ── Skinned mesh LOD strategy ──
      // Geometry simplify is ineffective for multi-part skinned characters
      // (Quaternius modular chars have ~4-5 submeshes × ~1-3K verts each;
      //  simplify can't reduce these small submeshes without exceeding error).
      // Instead, LOD1/LOD2 use Draco-compressed geometry + texture resize.
      // This saves bandwidth while keeping animation-compatible geometry.
      //
      // gltf-transform 4.x moved --texture-compress/--texture-size to 'optimize' only,
      // so we use a two-step approach: resize textures first, then Draco compress.
      //
      // LOD1: resize textures to 512px + Draco geometry compression
      // LOD2: resize textures to 256px + Draco geometry compression
      console.log('\n  Skinned LOD: texture-resize strategy (geometry unchanged)');

      const lod1ResizedTmp = `${paths.lod0}.lod1-resized.tmp.glb`;
      const lod2ResizedTmp = `${paths.lod0}.lod2-resized.tmp.glb`;

      // Step A: Resize textures for each LOD level
      runGltfTransform(
        root,
        ['resize', paths.lod0, lod1ResizedTmp, '--width', '512', '--height', '512'],
        `resize textures 512 → lod1-prep`,
        { exitOnFail },
      );
      runGltfTransform(
        root,
        ['resize', paths.lod0, lod2ResizedTmp, '--width', '256', '--height', '256'],
        `resize textures 256 → lod2-prep`,
        { exitOnFail },
      );

      // Step B: Draco-compress the resized versions
      runGltfTransform(
        root,
        ['draco', lod1ResizedTmp, paths.lod1],
        `lod1 (skinned) → ${rel(paths.lod1)} (draco+tex50%)`,
        { exitOnFail },
      );
      runGltfTransform(
        root,
        ['draco', lod2ResizedTmp, paths.lod2],
        `lod2 (skinned) → ${rel(paths.lod2)} (draco+tex25%)`,
        { exitOnFail },
      );

      // Clean up temp resized files
      try { if (existsSync(lod1ResizedTmp)) unlinkSync(lod1ResizedTmp); } catch {}
      try { if (existsSync(lod2ResizedTmp)) unlinkSync(lod2ResizedTmp); } catch {}
    } else {
      // ── Static mesh LOD strategy ──
      // Weld merges split vertices for cross-submesh simplification.
      // Relaxed error thresholds allow meaningful geometry reduction.
      const lod1Welded = `${paths.lod0}.lod1-welded.tmp.glb`;
      const lod2Welded = `${paths.lod0}.lod2-welded.tmp.glb`;

      runGltfTransform(
        root,
        ['weld', paths.lod0, lod1Welded],
        `weld → lod1-prep`,
        { exitOnFail },
      );
      runGltfTransform(
        root,
        ['weld', paths.lod0, lod2Welded],
        `weld → lod2-prep`,
        { exitOnFail },
      );

      // LOD1: 50% ratio with 0.5 error tolerance (50% mesh radius).
      runGltfTransform(
        root,
        ['simplify', lod1Welded, paths.lod1, '--ratio', '0.5', '--error', '0.5', '--lock-border', 'false'],
        `lod1 (static) → ${rel(paths.lod1)} (ratio=0.5, error=0.5, welded)`,
        { exitOnFail },
      );
      // LOD2: 20% ratio with 1.0 error tolerance (100% mesh radius).
      runGltfTransform(
        root,
        ['simplify', lod2Welded, paths.lod2, '--ratio', '0.2', '--error', '1.0', '--lock-border', 'false'],
        `lod2 (static) → ${rel(paths.lod2)} (ratio=0.2, error=1.0, welded)`,
        { exitOnFail },
      );

      // Clean up temp welded files
      try { if (existsSync(lod1Welded)) unlinkSync(lod1Welded); } catch {}
      try { if (existsSync(lod2Welded)) unlinkSync(lod2Welded); } catch {}
    }
  }

  return true;
}
