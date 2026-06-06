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
  BOTTOM_INTERACT_PROMPT: 172,
  /** Bottom-right stack */
  BOTTOM_AUTOSAVE: 16,
  BOTTOM_QUEST_TOAST: 76,
} as const;

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

export function bottomInteractPromptPx(): number {
  return EXPLORATION_HUD_LAYOUT.BOTTOM_INTERACT_PROMPT;
}

export function bottomAutoSavePx(): number {
  return EXPLORATION_HUD_LAYOUT.BOTTOM_AUTOSAVE;
}

export function bottomQuestToastPx(): number {
  return EXPLORATION_HUD_LAYOUT.BOTTOM_QUEST_TOAST;
}

/** Day/night widget — under minimap on narrow layouts */
export function explorationDayNightTopPx(): number {
  return explorationMinimapTopPx() + EXPLORATION_HUD_LAYOUT.MINIMAP_HEIGHT + 4;
}
