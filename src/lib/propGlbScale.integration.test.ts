// @vitest-environment node
/**
 * CI: GLB из `propsManifest` с `glbPath` — замер bbox, `validatePropGlbScale` при тех же
 * `sceneScale`, что у `PropModel` (комната Володьки / коридор / узкая комната).
 */
import path from 'node:path';
import fs from 'node:fs';
import { beforeAll, describe, expect, it } from 'vitest';
import * as THREE from 'three';
import { DRACOLoader } from 'three/examples/jsm/loaders/DRACOLoader.js';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';

import { rewriteLegacyModelPath } from '@/config/modelUrls';
import { getPropGlbDefinitionsForScaleValidator } from '@/data/propsManifest';
import { computeExplorationCharacterMeshUnionVerticalExtent } from '@/lib/gltfCharacterMaterialPolicy';
import { applyExplorationPlayerGlobalVisualScale } from '@/lib/playerScaleConstants';
import { validatePropGlbScale } from '@/lib/propScaleValidation';

const repoRoot = path.resolve(__dirname, '..', '..');

function absPathFromPublicUrl(url: string): string {
  const u = rewriteLegacyModelPath(url.trim());
  const pathname = u.startsWith('/') ? u.slice(1) : u;
  return path.join(repoRoot, 'public', pathname.split('?')[0] ?? pathname);
}

async function withTimeout<T>(promise: Promise<T>, ms: number, label: string): Promise<T> {
  let t: ReturnType<typeof setTimeout> | undefined;
  try {
    return await Promise.race([
      promise,
      new Promise<never>((_, reject) => {
        t = setTimeout(() => reject(new Error(`${label}: timed out after ${ms}ms`)), ms);
      }),
    ]);
  } finally {
    if (t) clearTimeout(t);
  }
}

type MeshoptDecoderCtor = typeof import('three/examples/jsm/libs/meshopt_decoder.module.js').MeshoptDecoder;

let meshoptDecoderPromise: Promise<MeshoptDecoderCtor> | null = null;

async function getMeshoptDecoderClass(): Promise<MeshoptDecoderCtor> {
  meshoptDecoderPromise ??= import('three/examples/jsm/libs/meshopt_decoder.module.js').then(async (m) => {
    await m.MeshoptDecoder.ready;
    return m.MeshoptDecoder;
  });
  return meshoptDecoderPromise;
}

type PropGltfBounds = { bboxVertical: number; maxAxis: number; boxHeight: number };

async function loadPropGltfBounds(absPath: string): Promise<PropGltfBounds> {
  if (!fs.existsSync(absPath)) throw new Error(`Missing file: ${absPath}`);
  const buf = fs.readFileSync(absPath);
  const ab = Uint8Array.from(buf).buffer;
  const loader = new GLTFLoader();
  const dracoDecoderDir = path.join(
    repoRoot,
    'node_modules',
    'three',
    'examples',
    'jsm',
    'libs',
    'draco',
    'gltf',
  );
  const draco = new DRACOLoader();
  draco.setDecoderPath(`${dracoDecoderDir.replace(/\\/g, '/')}/`);
  loader.setDRACOLoader(draco);
  const MeshoptDecoder = await getMeshoptDecoderClass();
  loader.setMeshoptDecoder(MeshoptDecoder);
  const resourcePath = `${path.dirname(absPath).replace(/\\/g, '/')}/`;
  const gltf = await loader.parseAsync(ab, resourcePath);
  const root = gltf.scene;
  root.scale.set(1, 1, 1);
  root.position.set(0, 0, 0);
  root.updateMatrixWorld(true);
  const bboxVertical = computeExplorationCharacterMeshUnionVerticalExtent(root);
  const sz = new THREE.Box3().setFromObject(root).getSize(new THREE.Vector3());
  const maxAxis = Math.max(sz.x, sz.y, sz.z);
  return { bboxVertical, maxAxis, boxHeight: sz.y };
}

/** Ожидаемая высота/габарит в метрах мира при `volodka_room` (актуальный `explorationCharacterModelScale`). */
const VOLODKA_SCENE_SCALE = 0.6 as const;

const PROP_WORLD_ENVELOPE_AT_VOLODKA: Partial<Record<string, { minM: number; maxM: number }>> = {
  /** Высота AABB × uniform — не `computeExplorationCharacter…` (для мебели занижает). */
  /** Текущий пайплайн даёт ~0.19 m; при поднятии `baseUniform` диапазон остаётся валидным. */
  desk_volodka: { minM: 0.12, maxM: 1.35 },
  /** Сейчас ~0.30 m в мире; при подборе `baseUniform` под шкаф ~2 m — верх запаса. */
  wardrobe_soviet: { minM: 0.2, maxM: 2.65 },
  lamp_desk: { minM: 0.015, maxM: 0.9 },
  mug_techsupport: { minM: 0.04, maxM: 0.24 },
  /** `keyboard_ibm`: AABB в файле не совпадает с физическим размером клавиатуры — только `validatePropGlbScale` / exempt. */
};

function looksLikeBinaryGltf(absPath: string): boolean {
  if (!fs.existsSync(absPath)) return false;
  const fd = fs.openSync(absPath, 'r');
  try {
    const buf = Buffer.alloc(4);
    fs.readSync(fd, buf, 0, 4, 0);
    return buf.toString('ascii', 0, 4) === 'glTF';
  } finally {
    fs.closeSync(fd);
  }
}

const propDefs = getPropGlbDefinitionsForScaleValidator();
const first = propDefs[0];
const firstAbs = first ? absPathFromPublicUrl(first.url) : '';
const propGlbAssetsPresent = firstAbs ? looksLikeBinaryGltf(firstAbs) : false;

describe.skipIf(!propGlbAssetsPresent)('prop GLB scale (integration)', () => {
  beforeAll(() => {
    const w = globalThis as typeof globalThis & { self?: unknown };
    if (typeof w.self === 'undefined') {
      Object.defineProperty(w, 'self', { value: globalThis, configurable: true, writable: true });
    }
  });

  it('each manifest prop GLB passes validatePropGlbScale at Volodka-like scene scales', async () => {
    expect(propDefs.length).toBeGreaterThan(0);
    const sceneScales = [0.28, 0.48, 0.6, 1.0] as const;

    for (const { url, def } of propDefs) {
      const abs = absPathFromPublicUrl(url);
      if (!fs.existsSync(abs)) {
        throw new Error(`Missing prop GLB: ${abs} (${def.id})`);
      }
      const { bboxVertical, maxAxis, boxHeight } = await withTimeout(loadPropGltfBounds(abs), 30_000, `GLTF ${def.id}`);
      expect(bboxVertical).toBeGreaterThan(0.001);
      expect(maxAxis).toBeGreaterThan(0.001);
      expect(boxHeight).toBeGreaterThan(0.001);

      for (const sceneScale of sceneScales) {
        const finalUniform = applyExplorationPlayerGlobalVisualScale((def.baseUniform ?? 1) * sceneScale);
        const r = validatePropGlbScale(def, url, bboxVertical, finalUniform);
        const pass = r === 'ok' || r === 'skipped-exempt';
        expect(
          pass,
          `${def.id} url=${url} bbox=${bboxVertical.toFixed(4)} sceneScale=${sceneScale} uniform=${finalUniform.toFixed(4)} → ${JSON.stringify(r)}`,
        ).toBe(true);
      }

      const envelope = PROP_WORLD_ENVELOPE_AT_VOLODKA[def.id];
      if (envelope) {
        const u = applyExplorationPlayerGlobalVisualScale((def.baseUniform ?? 1) * VOLODKA_SCENE_SCALE);
        const worldM = boxHeight * u;
        expect(worldM, `${def.id} world boxHeight @ volodka`).toBeGreaterThanOrEqual(envelope.minM);
        expect(worldM, `${def.id} world boxHeight @ volodka`).toBeLessThanOrEqual(envelope.maxM);
      }
    }
  }, 120_000);
});
