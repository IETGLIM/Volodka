/* ─── World clock tick rates (shared by useWorldClock + QuestTracker) ─── */

/** Real seconds between periodic world-clock ticks during exploration. */
export const WORLD_CLOCK_TICK_INTERVAL_S = 60;

/** In-game hours advanced per periodic tick. */
export const WORLD_CLOCK_HOURS_PER_TICK = 0.25;

/** Real milliseconds per in-game hour at the default world-clock rate. */
export const MS_PER_GAME_HOUR =
  (WORLD_CLOCK_TICK_INTERVAL_S * 1000) / WORLD_CLOCK_HOURS_PER_TICK;
