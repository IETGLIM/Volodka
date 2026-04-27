import { describe, expect, it } from 'vitest';
import { existsSync } from 'fs';
import { resolve } from 'path';
import { SCENE_CONFIG } from '@/config/scenes';
import type { SceneId } from '@/data/types';

/** Корень репозитория (vitest запускают из корня проекта). */
const REPO_ROOT = resolve(process.cwd());

function resolvePublicGlb(url: string): string {
  if (!url.startsWith('/')) return '';
  return resolve(REPO_ROOT, 'public', url.slice(1));
}

/**
 * Фаза 3: hero-path обход — стриминг-манифесты не ссылаются на битые публичные GLB,
 * соседи существуют в `SCENE_CONFIG`, id чанков согласованы со сценой.
 */
describe('exploration hero streaming integrity', () => {
  it('все neighborSceneIds из streaming указывают на существующие сцены', () => {
    for (const id of Object.keys(SCENE_CONFIG) as Array<keyof typeof SCENE_CONFIG>) {
      const cfg = SCENE_CONFIG[id];
      const neighbors = 'streaming' in cfg ? cfg.streaming?.neighborSceneIds : undefined;
      if (!neighbors?.length) continue;
      for (const n of neighbors) {
        expect(n in SCENE_CONFIG, `сцена "${id}": сосед "${n}" отсутствует в SCENE_CONFIG`).toBe(true);
      }
    }
  });

  it('id чанков hero slice (volodka_*) имеют префикс sceneId::', () => {
    const canonical: SceneId[] = ['volodka_room', 'volodka_corridor'];
    for (const id of canonical) {
      const chunks = SCENE_CONFIG[id].streaming?.chunks;
      if (!chunks?.length) continue;
      for (const ch of chunks) {
        expect(ch.id.startsWith(`${id}::`), `чанк "${ch.id}" должен начинаться с "${id}::"`).toBe(true);
      }
    }
  });

  it('hero P0: URL из streaming.chunks указывают на существующие файлы в public/', () => {
    const heroScenes: SceneId[] = ['volodka_room', 'volodka_corridor'];
    for (const sceneId of heroScenes) {
      const chunks = SCENE_CONFIG[sceneId].streaming?.chunks;
      expect(chunks?.length, `${sceneId} должен иметь чанки стриминга`).toBeGreaterThan(0);
      for (const ch of chunks!) {
        for (const asset of ch.assets ?? []) {
          if (typeof asset !== 'object' || !('url' in asset)) continue;
          const url = asset.url;
          if (!url.endsWith('.glb') && !url.endsWith('.gltf')) continue;
          const abs = resolvePublicGlb(url);
          expect(existsSync(abs), `нет файла для ${sceneId} chunk ${ch.id}: ${url}`).toBe(true);
        }
      }
    }
  });
});

/**
 * Инвентарь пола из `PhysicsSceneColliders` (половина размера по осям X/Z в плоскости пола).
 * При правке коллайдеров обновите и этот тест.
 */
describe('hero exploration spawn vs physics floor (фаза 3.1)', () => {
  it('volodka_room: спавн внутри AABB пола InstancedObstacles/стен', () => {
    const halfW = 7;
    const halfZ = 6.35;
    const { x, z } = SCENE_CONFIG.volodka_room.spawnPoint;
    const margin = 0.25;
    expect(Math.abs(x)).toBeLessThanOrEqual(halfW - margin);
    expect(Math.abs(z)).toBeLessThanOrEqual(halfZ - margin);
  });

  it('volodka_corridor: спавн внутри пола 3.5×13.2', () => {
    const halfW = 3.5 / 2;
    const halfZ = 13.2 / 2;
    const { x, z } = SCENE_CONFIG.volodka_corridor.spawnPoint;
    const margin = 0.2;
    expect(Math.abs(x)).toBeLessThanOrEqual(halfW - margin);
    expect(Math.abs(z)).toBeLessThanOrEqual(halfZ - margin);
  });

  it('zarema_albert_room: спавн внутри пола 10×8', () => {
    const halfW = 5;
    const halfZ = 4;
    const { x, z } = SCENE_CONFIG.zarema_albert_room.spawnPoint;
    const margin = 0.2;
    expect(Math.abs(x)).toBeLessThanOrEqual(halfW - margin);
    expect(Math.abs(z)).toBeLessThanOrEqual(halfZ - margin);
  });

  it('kitchen_night: спавн внутри пола 10×8 (тот же интерьер, что и zarema_albert_room)', () => {
    const halfW = 5;
    const halfZ = 4;
    const { x, z } = SCENE_CONFIG.kitchen_night.spawnPoint;
    const margin = 0.2;
    expect(Math.abs(x)).toBeLessThanOrEqual(halfW - margin);
    expect(Math.abs(z)).toBeLessThanOrEqual(halfZ - margin);
  });
});
