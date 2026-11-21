import { describe, expect, it } from 'vitest';
import { isMatrixRainEnabled } from './MatrixRain';

/* ─── v4.65.0: гейтинг матрицы-дождя по фазе игры ───
 * Репорт игрока: «куча непонятных слоёв» в бою. До фикса до 48
 * CSS-анимированных колонок (~450 DOM-узлов) висели под боевым UI
 * всю битву. Теперь combat-фаза гасит дождь полностью. */
describe('isMatrixRainEnabled', () => {
  it('disables rain entirely during combat (v4.65.0 fix)', () => {
    expect(isMatrixRainEnabled({ mode: 'combat', showStoryOverlay: false, hasScenePreset: true })).toBe(false);
    // Даже со story overlay поверх боя — бой важнее атмосферы
    expect(isMatrixRainEnabled({ mode: 'combat', showStoryOverlay: true, hasScenePreset: true })).toBe(false);
    // И в сцене с пресетом дождя (street_night)
    expect(isMatrixRainEnabled({ mode: 'combat', showStoryOverlay: false, hasScenePreset: true })).toBe(false);
  });

  it('keeps rain in exploration when scene has a preset', () => {
    expect(isMatrixRainEnabled({ mode: 'exploration', showStoryOverlay: false, hasScenePreset: true })).toBe(true);
  });

  it('keeps rain off in preset-less indoor scenes', () => {
    // volodka_room / home_evening — без пресета
    expect(isMatrixRainEnabled({ mode: 'exploration', showStoryOverlay: false, hasScenePreset: false })).toBe(false);
  });

  it('cutscene and story overlay require a scene preset', () => {
    expect(isMatrixRainEnabled({ mode: 'cutscene', showStoryOverlay: false, hasScenePreset: true })).toBe(true);
    expect(isMatrixRainEnabled({ mode: 'cutscene', showStoryOverlay: false, hasScenePreset: false })).toBe(false);
    expect(isMatrixRainEnabled({ mode: 'exploration', showStoryOverlay: true, hasScenePreset: false })).toBe(false);
  });

  it('menu and intro phases follow the scene-preset rule (no special case)', () => {
    expect(isMatrixRainEnabled({ mode: 'menu', showStoryOverlay: false, hasScenePreset: false })).toBe(false);
    expect(isMatrixRainEnabled({ mode: 'intro', showStoryOverlay: false, hasScenePreset: false })).toBe(false);
  });
});
