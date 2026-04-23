import { describe, expect, it } from 'vitest';
import { getDefaultPlayerModelPath } from '@/config/modelUrls';
import { getExplorationCharacterModelScale } from '@/config/scenes';
import { INTRO_CUTSCENE_UNIFORM_CAP, resolveCharacterMeshUniformScale } from '@/data/modelMeta';

describe('intro vs gameplay GLB uniform (volodka_room)', () => {
  it('интро-кап согласован с жёстким потолком modelMeta', () => {
    const u = resolveCharacterMeshUniformScale(getDefaultPlayerModelPath(), {
      roomModelScale: getExplorationCharacterModelScale('volodka_room'),
      introCutsceneActive: true,
      clampSceneId: 'volodka_room',
    });
    expect(u).toBeLessThanOrEqual(INTRO_CUTSCENE_UNIFORM_CAP);
  });
});
