import { describe, expect, it } from 'vitest';
import {
  SCENE_CONFIG,
  getExplorationCharacterModelScale,
  getExplorationLocomotionScale,
  getExplorationPlayerGltfTargetMeters,
} from './scenes';

/**
 * Шаг 5 (автоматическая часть): по всем локациям из `SCENE_CONFIG` проверяются данные,
 * от которых зависят движение игрока и масштаб в 3D-обходе. Ручной проход в браузере — в JSDoc у `PlayerController`.
 */
describe('exploration scenes movement / scale sanity (step 5 automation)', () => {
  const sceneIds = Object.keys(SCENE_CONFIG) as (keyof typeof SCENE_CONFIG)[];

  it('has at least one exploration scene', () => {
    expect(sceneIds.length).toBeGreaterThan(0);
  });

  it.each(sceneIds)('scene %s — exploration scales finite and in sane range', (sceneId) => {
    const ch = getExplorationCharacterModelScale(sceneId);
    const loc = getExplorationLocomotionScale(sceneId);
    const gltfTarget = getExplorationPlayerGltfTargetMeters(sceneId);
    expect(Number.isFinite(ch), `character scale for ${sceneId}`).toBe(true);
    expect(Number.isFinite(loc), `locomotion scale for ${sceneId}`).toBe(true);
    expect(Number.isFinite(gltfTarget), `player GLB target meters for ${sceneId}`).toBe(true);
    expect(ch, `character scale > 0 for ${sceneId}`).toBeGreaterThan(0.15);
    expect(ch, `character scale < 3 for ${sceneId}`).toBeLessThan(3);
    expect(loc, `locomotion scale > 0 for ${sceneId}`).toBeGreaterThan(0.1);
    expect(loc, `locomotion scale < 3 for ${sceneId}`).toBeLessThan(3);
    expect(gltfTarget, `player GLB target > 0.45 for ${sceneId}`).toBeGreaterThan(0.45);
    expect(gltfTarget, `player GLB target < 2 for ${sceneId}`).toBeLessThan(2);
  });

  it.each(sceneIds)('scene %s — spawn point and room size look usable for physics', (sceneId) => {
    const c = SCENE_CONFIG[sceneId];
    expect(c, `config for ${sceneId}`).toBeDefined();
    const { spawnPoint, size } = c;
    const [sx, sz] = size;
    expect(sx, `width for ${sceneId}`).toBeGreaterThan(2);
    expect(sz, `depth for ${sceneId}`).toBeGreaterThan(2);
    expect(Number.isFinite(spawnPoint.x)).toBe(true);
    expect(Number.isFinite(spawnPoint.y)).toBe(true);
    expect(Number.isFinite(spawnPoint.z)).toBe(true);
    expect(spawnPoint.y, `spawn y for ${sceneId}`).toBeGreaterThanOrEqual(-0.5);
    expect(spawnPoint.y, `spawn y for ${sceneId}`).toBeLessThan(12);
    const margin = 1.5;
    expect(Math.abs(spawnPoint.x), `spawn x in room for ${sceneId}`).toBeLessThanOrEqual(sx / 2 + margin);
    expect(Math.abs(spawnPoint.z), `spawn z in room for ${sceneId}`).toBeLessThanOrEqual(sz / 2 + margin);
  });

  it.each(sceneIds)('scene %s — NPC positions roughly inside padded room bounds', (sceneId) => {
    const c = SCENE_CONFIG[sceneId];
    const [sx, sz] = c.size;
    const pad = 4;
    const limX = sx / 2 + pad;
    const limZ = sz / 2 + pad;
    for (const npc of c.npcs) {
      const [x, , z] = npc.position;
      expect(Math.abs(x), `NPC ${npc.id} x in ${sceneId}`).toBeLessThanOrEqual(limX);
      expect(Math.abs(z), `NPC ${npc.id} z in ${sceneId}`).toBeLessThanOrEqual(limZ);
    }
  });
});
