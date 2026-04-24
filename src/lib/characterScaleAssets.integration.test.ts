// @vitest-environment node
/**
 * CI: загрузка каждого персонажного GLB с диска, замер bbox, проверка визуальной высоты
 * после `resolveCharacterMeshUniformScale` в «жёстких» комбинациях комнаты / NPC scale.
 *
 * В Node (vitest) `GLTFLoader` ожидает `self` как в браузере — полифилл ниже.
 * Текстуры могут не подтянуться (blob в Node); для bbox геометрии этого достаточно.
 */

import path from 'node:path';
import fs from 'node:fs';
import { beforeAll, describe, expect, it } from 'vitest';
import { DRACOLoader } from 'three/examples/jsm/loaders/DRACOLoader.js';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { computeExplorationCharacterMeshUnionVerticalExtent } from '@/lib/gltfCharacterMaterialPolicy';
import { rewriteLegacyModelPath } from '@/config/modelUrls';
import { resolveCharacterMeshUniformScale } from '@/data/modelMeta';
import { NPC_DEFINITIONS } from '@/data/npcDefinitions';
import type { NPCDefinition } from '@/data/rpgTypes';
import type { SceneId } from '@/data/types';
import {
  getCharacterModelUrlsForScaleValidator,
  validateCharacterScale,
} from './characterScaleValidator';

const repoRoot = path.resolve(__dirname, '..', '..');

function absPathFromPublicUrl(url: string): string {
  const u = rewriteLegacyModelPath(url.trim());
  const pathname = u.startsWith('/') ? u.slice(1) : u;
  return path.join(repoRoot, 'public', pathname.split('?')[0] ?? pathname);
}

function maxNpcDefinitionScaleForUrl(modelUrl: string): number {
  const canon = rewriteLegacyModelPath(modelUrl.trim());
  let m = 1;
  for (const def of Object.values(NPC_DEFINITIONS) as NPCDefinition[]) {
    const p = def.modelPath?.trim();
    if (!p) continue;
    if (rewriteLegacyModelPath(p) !== canon) continue;
    const s = def.scale;
    if (typeof s === 'number' && Number.isFinite(s) && s > 0 && s > m) m = s;
  }
  return m;
}

function minNpcDefinitionScaleForUrl(modelUrl: string): number {
  const canon = rewriteLegacyModelPath(modelUrl.trim());
  let m = Infinity;
  for (const def of Object.values(NPC_DEFINITIONS) as NPCDefinition[]) {
    const p = def.modelPath?.trim();
    if (!p) continue;
    if (rewriteLegacyModelPath(p) !== canon) continue;
    const s = def.scale;
    if (typeof s === 'number' && Number.isFinite(s) && s > 0) m = Math.min(m, s);
  }
  return Number.isFinite(m) ? m : 1;
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

async function loadVerticalBoundingExtent(absPath: string): Promise<number> {
  if (!fs.existsSync(absPath)) throw new Error(`Missing file: ${absPath}`);
  const buf = fs.readFileSync(absPath);
  /** Копия в непрерывный `ArrayBuffer` — pooled `Buffer` из Node даёт срез, который GLTFLoader иногда не принимает. */
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
  return computeExplorationCharacterMeshUnionVerticalExtent(root);
}

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

const probeUrl = getCharacterModelUrlsForScaleValidator()[0];
const probeAbs = absPathFromPublicUrl(probeUrl);
const characterGlbAssetsPresent = looksLikeBinaryGltf(probeAbs);

/** Полный прогон требует локальных GLB в `public/` (см. `modelUrls` / LFS). */
describe.skipIf(!characterGlbAssetsPresent)('character GLB visual height (integration)', () => {
  beforeAll(() => {
    const w = globalThis as typeof globalThis & { self?: unknown };
    if (typeof w.self === 'undefined') {
      Object.defineProperty(w, 'self', { value: globalThis, configurable: true, writable: true });
    }
  });

  it(
    'each registered character model stays within height band at extreme uniforms',
    async () => {
      const urls = getCharacterModelUrlsForScaleValidator();
      expect(urls.length).toBeGreaterThan(5);

      const narrowScene: SceneId = 'zarema_albert_room';

      for (const url of urls) {
        const abs = absPathFromPublicUrl(url);
        if (!fs.existsSync(abs)) {
          throw new Error(`Missing GLB for scale check: ${abs} (url ${url})`);
        }

        const bboxH = await withTimeout(
          loadVerticalBoundingExtent(abs),
          30_000,
          `GLTF parse ${url}`,
        );
        expect(bboxH).toBeGreaterThan(0.01);

        const maxDef = maxNpcDefinitionScaleForUrl(url);
        const minDef = Math.min(1, minNpcDefinitionScaleForUrl(url));

        const uLargest = resolveCharacterMeshUniformScale(url, {
          roomModelScale: 1.25,
          definitionModelScale: maxDef,
          introCutsceneActive: false,
          clampSceneId: undefined,
        });

        const rMax = validateCharacterScale(url, bboxH, uLargest);
        expect(rMax, `MAX check ${url} uniform=${uLargest} bbox=${bboxH}`).toBe('ok');

        const uSmallest = resolveCharacterMeshUniformScale(url, {
          roomModelScale: 0.28,
          definitionModelScale: minDef,
          introCutsceneActive: true,
          clampSceneId: narrowScene,
        });

        const rMin = validateCharacterScale(url, bboxH, uSmallest);
        expect(rMin, `MIN check ${url} uniform=${uSmallest} bbox=${bboxH}`).toBe('ok');
      }
    },
    120_000,
  );
});
