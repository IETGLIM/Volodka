/**
 * Sprint 0 HUD information architecture — primary vs overflow.
 * Top bar stays lean for the first hour; low-frequency actions live in «Ещё».
 */

/** Visible top-bar panel openers (hotkeys still work for everything else). */
export const HUD_PRIMARY_ACTIONS = ['quests', 'inventory'] as const;

/**
 * Actions that used to sit on the top bar and now belong in overflow.
 * Save is intentionally omitted — pause menu (Esc) already owns quick-save.
 */
export const HUD_OVERFLOW_FROM_TOPBAR = [
  'journal',
  'crafting',
  'trading',
  'photo',
  'stats',
] as const;

export const HUD_OVERFLOW_SECTION_TITLES = {
  play: 'Игра',
  character: 'Персонаж',
  world: 'Мир',
  system: 'Система',
} as const;

export type HudPrimaryAction = (typeof HUD_PRIMARY_ACTIONS)[number];
export type HudOverflowFromTopbar = (typeof HUD_OVERFLOW_FROM_TOPBAR)[number];
