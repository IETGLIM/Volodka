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
  /** Minimap block (160px map + chrome) */
  MINIMAP_HEIGHT: 196,
  RIGHT_INSET: 12,
  /** Bottom-center stack (px from viewport bottom) */
  BOTTOM_TOOLBAR: 12,
  BOTTOM_QUICK_USE: 56,
  BOTTOM_POETRY: 100,
  /** Crafting discovery toasts — above quick-use bar */
  BOTTOM_CRAFTING_TOAST: 80,
  /** Contextual [E] prompt — above poetry bar, centered */
  BOTTOM_INTERACT_PROMPT: 196,
  /** Bottom-right stack (px from viewport bottom) */
  BOTTOM_AMBIENT_MIXER: 16,
  BOTTOM_STATUS_EFFECTS: 72,
  BOTTOM_MORAL_COMPASS: 128,
  BOTTOM_AUTOSAVE: 16,
  BOTTOM_QUEST_TOAST: 76,
  RIGHT_INSET_COMPACT: 16,
  /** Reserve above ExplorationMobileHud column (portrait controls). */
  MOBILE_BOTTOM_CONTROLS_RESERVE: 108,
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

/** Stat/karma toasts — below achievement column */
export function explorationStatToastTopPx(): number {
  return explorationAchievementTopPx() + 88;
}

/** Event popups (combat/scene) — top-right, clear of minimap */
export function explorationEventToastTopPx(): number {
  return EXPLORATION_HUD_LAYOUT.TOP_BAR_HEIGHT + EXPLORATION_HUD_LAYOUT.SLOT_GAP;
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

export function bottomCraftingToastPx(isMobile = false): number {
  return EXPLORATION_HUD_LAYOUT.BOTTOM_CRAFTING_TOAST + mobileBottomReserve(isMobile);
}

export function bottomInteractPromptPx(): number {
  return EXPLORATION_HUD_LAYOUT.BOTTOM_INTERACT_PROMPT;
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

export function bottomMoralCompassPx(): number {
  return EXPLORATION_HUD_LAYOUT.BOTTOM_MORAL_COMPASS;
}

export function bottomRightInsetPx(): number {
  return EXPLORATION_HUD_LAYOUT.RIGHT_INSET_COMPACT;
}

/** Day/night widget — under minimap on narrow layouts */
export function explorationDayNightTopPx(): number {
  return explorationMinimapTopPx() + EXPLORATION_HUD_LAYOUT.MINIMAP_HEIGHT + 4;
}
