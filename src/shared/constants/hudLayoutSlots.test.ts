import { describe, expect, it } from 'vitest';
import {
  EXPLORATION_HUD_LAYOUT,
  QUEST_OBJECTIVE_CARD_HEIGHT,
  bottomAmbientMixerPx,
  bottomAudioVisualizerPx,
  bottomCenterAlertPx,
  bottomCenterGuidePx,
  bottomCenterGuidancePx,
  bottomCenterHintPx,
  bottomCenterHintSecondaryPx,
  bottomCenterHintTertiaryPx,
  bottomInteractPromptPx,
  bottomStatusEffectsPx,
  explorationAchievementCardSafeTopPx,
  explorationDayNightTopPx,
  explorationMinimapTopPx,
  explorationQuestCardTopPx,
  explorationWeatherTopPx,
} from './hudLayout';

/* ─── Контракт слот-сетки HUD (этап 92, v4.23) ───
 *
 * Инвариант v4.22–v4.23: любой постоянный HUD-виджет берёт координату
 * из hudLayout.ts, и слоты в колонке не пересекаются. Этот тест —
 * статический детектор коллизий: при добавлении/сдвиге слота он поймает
 * наложение до деплоя (история: квест-карта ↔ день/ночь, тулбар ↔ тосты,
 * [E]-промпт ↔ тревога хазарда, миксер ↔ визуализатор).
 */

const GAP = EXPLORATION_HUD_LAYOUT.SLOT_GAP;

describe('слот-сетка HUD: правая колонка (миникарта → квест-карта → день/ночь → погода)', () => {
  it('миникарта не пересекается с квест-картой', () => {
    const minimapBottom = explorationMinimapTopPx() + EXPLORATION_HUD_LAYOUT.MINIMAP_HEIGHT;
    expect(explorationQuestCardTopPx()).toBeGreaterThanOrEqual(minimapBottom + GAP);
  });

  it('квест-карта не пересекается с виджетом дня/ночи', () => {
    const questBottom = explorationQuestCardTopPx() + QUEST_OBJECTIVE_CARD_HEIGHT;
    expect(explorationDayNightTopPx()).toBeGreaterThanOrEqual(questBottom + GAP);
  });

  it('день/ночь не пересекается с погодой', () => {
    expect(explorationWeatherTopPx()).toBeGreaterThanOrEqual(
      explorationDayNightTopPx() + EXPLORATION_HUD_LAYOUT.DAY_NIGHT_HEIGHT + GAP,
    );
  });

  it('достижения получают слот под квест-картой (CardSafe)', () => {
    expect(explorationAchievementCardSafeTopPx()).toBe(
      explorationQuestCardTopPx() + QUEST_OBJECTIVE_CARD_HEIGHT + GAP,
    );
  });
});

describe('слот-сетка HUD: нижний центр (цепочка подсказок)', () => {
  /* Desktop: строгая цепочка с шагом ≥ 48px. Высокая карточка режиссуры
   * (~90px: текст + прогресс-точки) учтена отдельным правилом ниже. */
  it('desktop: цепочка строго возрастает с зазором ≥ 48px', () => {
    const chain = [
      ['guidance (FirstMinutesDirector)', bottomCenterGuidancePx(false)],
      ['[E]-промпт', bottomInteractPromptPx(false)],
      ['primary (PlayerLostHintToast)', bottomCenterHintPx(false)],
      ['secondary (ContextualHint)', bottomCenterHintSecondaryPx(false)],
      ['tertiary (CriticalStatusWhisper)', bottomCenterHintTertiaryPx(false)],
      ['guide (AaaImmersiveGuide)', bottomCenterGuidePx(false)],
      ['alert (HazardStatusIndicator)', bottomCenterAlertPx(false)],
    ] as const;

    for (let i = 1; i < chain.length; i++) {
      const [, prev] = chain[i - 1];
      const [, cur] = chain[i];
      expect(cur, `${chain[i][0]} над ${chain[i - 1][0]}`).toBeGreaterThanOrEqual(prev + 48);
    }
  });

  it('desktop: высокая карточка режиссуры (~90px) помещается между поэзией и промптом', () => {
    const guidance = bottomCenterGuidancePx(false);
    const guidanceTop = guidance + 90; // текст + прогресс-точки
    const poetryTop = EXPLORATION_HUD_LAYOUT.BOTTOM_POETRY;
    const poetryBottom = poetryTop + EXPLORATION_HUD_LAYOUT.BOTTOM_POETRY_HEIGHT;
    expect(guidance).toBeGreaterThanOrEqual(poetryBottom);
    expect(guidanceTop).toBeLessThanOrEqual(bottomInteractPromptPx(false));
  });

  it('mobile: primary — единственный ряд под промптом, остальные тосты — общий слот над ним', () => {
    const promptBottom = bottomInteractPromptPx(true);
    const promptTop = promptBottom + 48;

    // primary — строка ~44px между поднятой поэзией (292) и промптом (402).
    expect(bottomCenterHintPx(true) + 44).toBeLessThanOrEqual(promptBottom);
    expect(bottomCenterHintPx(true)).toBeGreaterThanOrEqual(296);

    // Общий слот вторичных тостов (guidance/secondary/tertiary/guide/alert)
    // — строго над промптом, без конфликтов с интерактивом.
    const shared = bottomCenterHintSecondaryPx(true);
    expect(shared).toBeGreaterThanOrEqual(promptTop + 6);
    expect(bottomCenterGuidancePx(true)).toBe(shared);
    expect(bottomCenterHintTertiaryPx(true)).toBe(shared);
    expect(bottomCenterGuidePx(true)).toBe(shared);
    expect(bottomCenterAlertPx(true)).toBe(shared);
  });
});

describe('слот-сетка HUD: правый нижний угол (миксер → статусы → помощь → визуализатор)', () => {
  it('ряды не пересекаются', () => {
    // Миксер: bottom 16, высота тоггла ~44px.
    expect(bottomStatusEffectsPx()).toBeGreaterThanOrEqual(bottomAmbientMixerPx() + 44);
    // Кнопка помощи сидит на statusEffects + 44 (EmergencHelpButton).
    const helpTop = bottomStatusEffectsPx() + 44;
    // Визуализатор — над помощью.
    expect(bottomAudioVisualizerPx()).toBeGreaterThanOrEqual(helpTop + 44);
  });
});

describe('слоты — конечные неотрицательные числа', () => {
  it('никакой слот не NaN/отрицательный', () => {
    const slots = [
      explorationMinimapTopPx(),
      explorationQuestCardTopPx(),
      explorationDayNightTopPx(),
      explorationWeatherTopPx(),
      bottomCenterGuidancePx(false),
      bottomCenterGuidancePx(true),
      bottomInteractPromptPx(false),
      bottomInteractPromptPx(true),
      bottomCenterHintPx(false),
      bottomCenterHintPx(true),
      bottomCenterHintSecondaryPx(false),
      bottomCenterHintTertiaryPx(false),
      bottomCenterGuidePx(false),
      bottomCenterAlertPx(false),
      bottomAudioVisualizerPx(),
      bottomStatusEffectsPx(),
      bottomAmbientMixerPx(),
    ];
    for (const slot of slots) {
      expect(Number.isFinite(slot)).toBe(true);
      expect(slot).toBeGreaterThanOrEqual(0);
    }
  });
});
