import { describe, expect, it } from 'vitest';
import { getSceneConfig } from '@/config/scenes';

/**
 * Фаза 4: hero-сцены с 3D-обходом должны давать `explorationTutorialHints` для первого кадра туториала
 * (`TutorialOverlay` + тач-тексты при `useTouchGameControls`).
 */
describe('exploration mobile hero hints', () => {
  it('volodka_room и zarema_albert_room имеют explorationTutorialHints', () => {
    const vol = getSceneConfig('volodka_room');
    const za = getSceneConfig('zarema_albert_room');
    expect(vol.explorationTutorialHints?.length).toBeGreaterThanOrEqual(1);
    expect(za.explorationTutorialHints?.length).toBeGreaterThanOrEqual(1);
  });
});
