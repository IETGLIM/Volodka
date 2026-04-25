import { describe, expect, it } from 'vitest';
import { getDefaultPlayerModelPath } from '@/config/modelUrls';
import {
  INTRO_CUTSCENE_UNIFORM_CAP,
  resolveCharacterMeshUniformScale,
} from '@/data/modelMeta';
import { getExplorationCharacterModelScale } from '@/config/scenes';

describe('resolveCharacterMeshUniformScale', () => {
  const playerUrl = getDefaultPlayerModelPath();

  it('интро ужимает uniform относительно геймплея в volodka_room', () => {
    const rs = getExplorationCharacterModelScale('volodka_room');
    const game = resolveCharacterMeshUniformScale(playerUrl, {
      roomModelScale: rs,
      introCutsceneActive: false,
      clampSceneId: 'volodka_room',
    });
    const intro = resolveCharacterMeshUniformScale(playerUrl, {
      roomModelScale: rs,
      introCutsceneActive: true,
      clampSceneId: 'volodka_room',
    });
    expect(intro).toBeLessThanOrEqual(INTRO_CUTSCENE_UNIFORM_CAP);
    expect(intro).toBeLessThan(game);
  });

  it('узкая сцена даёт потолок не выше капа volodka_room', () => {
    const u = resolveCharacterMeshUniformScale(playerUrl, {
      roomModelScale: 1,
      introCutsceneActive: false,
      clampSceneId: 'volodka_room',
    });
    expect(u).toBeLessThanOrEqual(0.24);
  });

  it('zarema_albert_room: потолок uniform не выше узкого капа комнаты', () => {
    const rs = getExplorationCharacterModelScale('zarema_albert_room');
    const u = resolveCharacterMeshUniformScale(playerUrl, {
      roomModelScale: rs,
      introCutsceneActive: false,
      clampSceneId: 'zarema_albert_room',
    });
    expect(u).toBeLessThanOrEqual(0.095);
  });

  it('учитывает definitionModelScale для NPC', () => {
    const url = '/models/college_girl.glb';
    const base = resolveCharacterMeshUniformScale(url, {
      roomModelScale: 0.9,
      definitionModelScale: 1,
      clampSceneId: 'kitchen_night',
    });
    const scaled = resolveCharacterMeshUniformScale(url, {
      roomModelScale: 0.9,
      definitionModelScale: 1.2,
      clampSceneId: 'kitchen_night',
    });
    expect(scaled).toBeGreaterThan(base);
  });
});
