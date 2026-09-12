/**
 * Shared layout slots for exploration HUD — single source for vertical positions.
 * Prevents compass, objectives, minimap, and toast columns from overlapping.
 */
export const EXPLORATION_HUD_LAYOUT = {
  /** Scene name / stats bar at the very top (matches HUD top bar on sm+) */
  TOP_BAR_HEIGHT: 52,
  SLOT_GAP: 6,
  COMPASS_HEIGHT: 32,
  OBJECTIVE_STRIP_HEIGHT: 44,
  OBJECTIVE_MAX_WIDTH: 360,
  /** Minimap block (160px map + chrome + 44px touch-target zoom row) */
  MINIMAP_HEIGHT: 222,
  RIGHT_INSET: 12,
  /** FIX (v4.22): левые панели (NpcScheduleDisplay, ExplorationHintsPanel) раньше
   *  использовали RIGHT_INSET — работало по совпадению (оба = 12px).
   *  Именованный LEFT_INSET устраняет смысловую ошибку. */
  LEFT_INSET: 12,
  /** Bottom-center stack (px from viewport bottom) */
  BOTTOM_TOOLBAR: 12,
  /** QuickAccessToolbar chrome (~48px content + padding) */
  BOTTOM_TOOLBAR_HEIGHT: 52,
  BOTTOM_QUICK_USE: 68,
  /** QuickUseBar slot row (~48px) */
  BOTTOM_QUICK_USE_HEIGHT: 48,
  BOTTOM_POETRY: 124,
  /** PoetryPowerBar row (~56px) */
  BOTTOM_POETRY_HEIGHT: 56,
  /** Crafting discovery toasts — above poetry bar */
  BOTTOM_CRAFTING_TOAST: 188,
  /** System alerts stack above crafting toasts (crafting + quick-use tier gap). */
  SYSTEM_ALERT_ABOVE_CRAFTING_OFFSET: 56,
  /** Contextual [E] prompt — above poetry bar, centered */
  BOTTOM_INTERACT_PROMPT: 196,
  /** Diegetic dialogue panel max text height (px) */
  DIEGETIC_DIALOGUE_TEXT_MAX_HEIGHT: 240,
  /** Bottom-right stack (px from viewport bottom) */
  BOTTOM_AMBIENT_MIXER: 16,
  BOTTOM_STATUS_EFFECTS: 72,
  /** Live poem TTL chips — above status effects on the left */
  BOTTOM_POEM_ACTIVE_EFFECTS: 124,
  BOTTOM_MORAL_COMPASS: 128,
  BOTTOM_AUTOSAVE: 16,
  BOTTOM_QUEST_TOAST: 76,
  RIGHT_INSET_COMPACT: 16,
  /** Reserve above ExplorationMobileHud column (portrait controls). */
  MOBILE_BOTTOM_CONTROLS_RESERVE: 168,
  /** Approximate height of the DayNightCycleIndicator widget */
  DAY_NIGHT_HEIGHT: 145,
} as const;

function mobileBottomReserve(isMobile: boolean): number {
  return isMobile ? EXPLORATION_HUD_LAYOUT.MOBILE_BOTTOM_CONTROLS_RESERVE : 0;
}

/** Left column: loot/item toasts below top bar */
export function explorationLootTopPx(): number {
  return EXPLORATION_HUD_LAYOUT.TOP_BAR_HEIGHT + EXPLORATION_HUD_LAYOUT.SLOT_GAP + 8;
}

export function explorationCompassTopPx(): number {
  return EXPLORATION_HUD_LAYOUT.TOP_BAR_HEIGHT + EXPLORATION_HUD_LAYOUT.SLOT_GAP;
}

export function explorationObjectiveTopPx(): number {
  return (
    explorationCompassTopPx()
    + EXPLORATION_HUD_LAYOUT.COMPASS_HEIGHT
    + EXPLORATION_HUD_LAYOUT.SLOT_GAP
  );
}

/** Right column: minimap sits below objective strip */
export function explorationMinimapTopPx(): number {
  return (
    explorationObjectiveTopPx()
    + EXPLORATION_HUD_LAYOUT.OBJECTIVE_STRIP_HEIGHT
    + EXPLORATION_HUD_LAYOUT.SLOT_GAP
  );
}

/** Achievement toasts — below minimap on the right */
export function explorationAchievementTopPx(): number {
  return explorationMinimapTopPx() + EXPLORATION_HUD_LAYOUT.MINIMAP_HEIGHT + EXPLORATION_HUD_LAYOUT.SLOT_GAP;
}

/** FIX (overlap): QuestObjectiveCard — постоянный слот под миникартой.
 *  Раньше карточка висела на top: clamp(168px, 18vh, 196px) и налегала на
 *  вертикальный диапазон миникарты (146–342px). Теперь вся правая колонка
 *  живёт по единой сетке: индикатор сложности → миникарта → квест-карта →
 *  тосты достижений → стат-пипсы. */
export function explorationQuestCardTopPx(): number {
  return explorationAchievementTopPx();
}

/** Компактная квест-карта: бюджет высоты (заголовок + чеклист + прогресс). */
export const QUEST_OBJECTIVE_CARD_HEIGHT = 216;

/** Achievement toasts — под квест-картой в правой колонке */
export function explorationAchievementCardSafeTopPx(): number {
  return explorationQuestCardTopPx() + QUEST_OBJECTIVE_CARD_HEIGHT + EXPLORATION_HUD_LAYOUT.SLOT_GAP;
}

/** Stat/karma toasts — below achievement column */
export function explorationStatToastTopPx(): number {
  return explorationAchievementTopPx() + 88;
}

/** Event popups (combat/scene) — top-CENTER, ниже топ-бара и бара здоровья
 *  босса. FIX (v4.17.1): раньше слот был right-3 @58px и наезжал на
 *  DifficultyIndicator (top:48) и BuffDebuffTracker (top:84) правой
 *  колонки. Центр свободен: лево занято лут/лор-тостами и компасом,
 *  право — миникартой и квест-картой. */
export function explorationEventToastTopPx(): number {
  return EXPLORATION_HUD_LAYOUT.TOP_BAR_HEIGHT + EXPLORATION_HUD_LAYOUT.SLOT_GAP + 38;
}

/** Lore/codex discovery toasts — top-left under objective strip */
export function explorationLoreToastTopPx(): number {
  return (
    explorationObjectiveTopPx()
    + EXPLORATION_HUD_LAYOUT.OBJECTIVE_STRIP_HEIGHT
    + EXPLORATION_HUD_LAYOUT.SLOT_GAP
  );
}

export function bottomToolbarPx(): number {
  return EXPLORATION_HUD_LAYOUT.BOTTOM_TOOLBAR;
}

export function bottomQuickUsePx(): number {
  return EXPLORATION_HUD_LAYOUT.BOTTOM_QUICK_USE;
}

export function bottomPoetryPx(): number {
  return EXPLORATION_HUD_LAYOUT.BOTTOM_POETRY;
}

/** Total height of the bottom-center HUD stack (toolbar → quick-use → poetry). */
export function explorationBottomStackHeightPx(isMobile = false): number {
  const mobileReserve = mobileBottomReserve(isMobile);
  return (
    EXPLORATION_HUD_LAYOUT.BOTTOM_TOOLBAR
    + EXPLORATION_HUD_LAYOUT.BOTTOM_TOOLBAR_HEIGHT
    + EXPLORATION_HUD_LAYOUT.SLOT_GAP
    + EXPLORATION_HUD_LAYOUT.BOTTOM_QUICK_USE_HEIGHT
    + EXPLORATION_HUD_LAYOUT.SLOT_GAP
    + EXPLORATION_HUD_LAYOUT.BOTTOM_POETRY_HEIGHT
    + mobileReserve
  );
}

export function bottomTutorialTipPx(): number {
  return (
    EXPLORATION_HUD_LAYOUT.BOTTOM_CRAFTING_TOAST
    + EXPLORATION_HUD_LAYOUT.SLOT_GAP
  );
}

/** Thin stamina strip — just above the bottom-center HUD stack
 *  (toolbar / quick-use / poetry bar). Hidden while stamina is full. */
export function bottomStaminaBarPx(isMobile = false): number {
  return explorationBottomStackHeightPx(isMobile) + EXPLORATION_HUD_LAYOUT.SLOT_GAP;
}

export function bottomCraftingToastPx(isMobile = false): number {
  return EXPLORATION_HUD_LAYOUT.BOTTOM_CRAFTING_TOAST + mobileBottomReserve(isMobile);
}

export function bottomSystemAlertPx(isMobile = false): number {
  return (
    bottomCraftingToastPx(isMobile) + EXPLORATION_HUD_LAYOUT.SYSTEM_ALERT_ABOVE_CRAFTING_OFFSET
  );
}

export function bottomInteractPromptPx(isMobile = false): number {
  return (
    EXPLORATION_HUD_LAYOUT.BOTTOM_POETRY
    + EXPLORATION_HUD_LAYOUT.BOTTOM_POETRY_HEIGHT
    + EXPLORATION_HUD_LAYOUT.SLOT_GAP
    + 48
    /* FIX (v4.23): на desktop ещё +48 — над слотом режиссуры первых минут
     * (высокая карточка ~90px: текст + прогресс-точки, bottom 186, верх
     * ≈276). Раньше промпт на 234 наезжал на её верх. На мобильном резерв
     * контролов и так поднимает промпт выше всей цепочки. */
    + (isMobile ? 0 : 48)
    + mobileBottomReserve(isMobile)
  );
}

/** FIX (overlap, v4.22/v4.23): нижне-центральные тосты-подсказки.
 *  Desktop-цепочка (строго возрастает, шаг 58px): режиссура (186, высокая
 *  карточка) → [E]-промпт (282) → primary (340) → secondary (398) →
 *  tertiary (456) → guide (514) → alert (572).
 *  Мобильный бюджет высоты жёсткий (поэзия поднята CSS до 292, промпт
 *  на 402–450): primary (352, верх ≈396) — единственный ряд под промптом;
 *  все остальные кратковременные тосты (guidance/secondary/tertiary/
 *  guide/alert) делят ОДИН слот 460 над промптом — детерминированного
 *  конфликта с интерактивом нет, взаимные наложения редких транзиентов —
 *  сознательный компромисс (вместо башни до середины экрана). */
export function bottomCenterHintPx(isMobile = false): number {
  if (isMobile) return EXPLORATION_HUD_LAYOUT.MOBILE_BOTTOM_CONTROLS_RESERVE + 184;
  return bottomInteractPromptPx() + 58;
}

/** Второй ряд (ContextualHint). */
export function bottomCenterHintSecondaryPx(isMobile = false): number {
  if (isMobile) return EXPLORATION_HUD_LAYOUT.MOBILE_BOTTOM_CONTROLS_RESERVE + 292;
  return bottomCenterHintPx(isMobile) + 58;
}

/** Третий ряд (CriticalStatusWhisper — «Силы на исходе»).
 *  FIX (v4.23): раньше делил secondary-слот с ContextualHint — при
 *  одновременном показе наезжали друг на друга. На мобильном — общий
 *  слот вторичных тостов (см. модель в начале блока). */
export function bottomCenterHintTertiaryPx(isMobile = false): number {
  if (isMobile) return bottomCenterHintSecondaryPx(true);
  return bottomCenterHintSecondaryPx(isMobile) + 58;
}

/** Слот режиссуры первых минут (FirstMinutesDirector).
 *  FIX (v4.23): был хардкод bottom-[14vh] — на низких вьюпортах
 *  наезжал на поэзию/[E]-промпт. Desktop — между поэзией и промптом
 *  (высокая карточка ~90px вписана в зазор). Мобильный — общий слот
 *  вторичных тостов над промптом (между поэзией 292 и промптом 402
 *  высокую карточку не вписать). */
export function bottomCenterGuidancePx(isMobile = false): number {
  if (isMobile) return bottomCenterHintSecondaryPx(true);
  return (
    EXPLORATION_HUD_LAYOUT.BOTTOM_POETRY
    + EXPLORATION_HUD_LAYOUT.BOTTOM_POETRY_HEIGHT
    + EXPLORATION_HUD_LAYOUT.SLOT_GAP
  );
}

/** Слот «внутреннего голоса» (AaaImmersiveGuide — диегетический шёпот).
 *  FIX (v4.23): был хардкод bottom-[22vh] — плавал относительно нижнего
 *  стека. На мобильном — общий слот вторичных тостов. */
export function bottomCenterGuidePx(isMobile = false): number {
  if (isMobile) return bottomCenterHintSecondaryPx(true);
  return bottomCenterHintTertiaryPx(isMobile) + 58;
}

/** Слот тревоги об опасной зоне (HazardStatusIndicator).
 *  FIX (v4.23): был хардкод clamp(184px, 24vh, 248px) — нижний край
 *  диапазона наезжал на слот [E]-промпта. Теперь вершина desktop-цепочки;
 *  на мобильном — общий слот вторичных тостов. */
export function bottomCenterAlertPx(isMobile = false): number {
  if (isMobile) return bottomCenterHintSecondaryPx(true);
  return bottomCenterGuidePx(isMobile) + 58;
}

/** FIX (v4.23): аудио-визуализатор был на bottom-4/right-4 — налегал на
 *  миксер звука (тот же угол: bottom 16 / right 16). Теперь четвёртый ряд
 *  правой нижней колонки: миксер (16) → статусы (72) → помощь (116) →
 *  визуализатор (168). */
export function bottomAudioVisualizerPx(): number {
  return EXPLORATION_HUD_LAYOUT.BOTTOM_STATUS_EFFECTS + 96;
}

/** Diegetic dialogue panel — lift above mobile D-pad / action column + home indicator. */
export function diegeticDialogueBottomPadCss(isMobile = false, stackVisible = true): string {
  const stackPx = stackVisible ? explorationBottomStackHeightPx(isMobile) : 0;
  // explorationBottomStackHeightPx already includes the mobile controls
  // reserve. When the stack is suppressed, the controls are suppressed too.
  const basePx = 16 + stackPx;
  return `calc(${basePx}px + env(safe-area-inset-bottom, 0px))`;
}

export function bottomAutoSavePx(isMobile = false): number {
  return EXPLORATION_HUD_LAYOUT.BOTTOM_AUTOSAVE + mobileBottomReserve(isMobile);
}

export function bottomQuestToastPx(isMobile = false): number {
  return EXPLORATION_HUD_LAYOUT.BOTTOM_QUEST_TOAST + mobileBottomReserve(isMobile);
}

export function bottomAmbientMixerPx(): number {
  return EXPLORATION_HUD_LAYOUT.BOTTOM_AMBIENT_MIXER;
}

export function bottomStatusEffectsPx(): number {
  return EXPLORATION_HUD_LAYOUT.BOTTOM_STATUS_EFFECTS;
}

export function bottomPoemActiveEffectsPx(): number {
  return EXPLORATION_HUD_LAYOUT.BOTTOM_POEM_ACTIVE_EFFECTS;
}

/** Mobile: poem TTL chips sit above the poetry power bar. */
export function bottomPoemActiveEffectsMobilePx(isMobile = false): number {
  return (
    EXPLORATION_HUD_LAYOUT.BOTTOM_POETRY
    + EXPLORATION_HUD_LAYOUT.BOTTOM_POETRY_HEIGHT
    + EXPLORATION_HUD_LAYOUT.SLOT_GAP
    + (isMobile ? EXPLORATION_HUD_LAYOUT.MOBILE_BOTTOM_CONTROLS_RESERVE : 0)
    + 52
  );
}

export function bottomMoralCompassPx(): number {
  return EXPLORATION_HUD_LAYOUT.BOTTOM_MORAL_COMPASS;
}

export function bottomRightInsetPx(): number {
  return EXPLORATION_HUD_LAYOUT.RIGHT_INSET_COMPACT;
}

/** Day/night widget — под квест-картой в правой колонке.
 *  FIX (overlap, v4.22): раньше виджет висел на minimapBottom+4 и налегал на
 *  QuestObjectiveCard (minimapBottom+6, высота до 216px) — два постоянных
 *  виджета рисовались друг на друге. Теперь цепочка правой колонки строго
 *  вертикальная: миникарта → квест-карта → день/ночь → погода. */
export function explorationDayNightTopPx(): number {
  return explorationAchievementCardSafeTopPx();
}

/** Weather widget — below day/night cycle on the right */
export function explorationWeatherTopPx(): number {
  return explorationDayNightTopPx() + EXPLORATION_HUD_LAYOUT.DAY_NIGHT_HEIGHT + EXPLORATION_HUD_LAYOUT.SLOT_GAP;
}
