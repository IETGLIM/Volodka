/**
 * Poem power cooldowns — single source of truth.
 *
 * Used by both the store layer (worldSlice.activatePoemPower) and the engine
 * layer (PoemPowerSystem.POEM_POWERS) so that the store never has to import
 * from @/engine/* (which would violate the layering contract documented in
 * src/store/types.ts).
 *
 * If you add a new poem power, register its cooldown here AND in
 * PoemPowerSystem.POEM_POWERS — they MUST stay in sync. A mismatch would mean
 * the store records a different cooldown than the engine expects.
 *
 * Values are in in-game hours (float). Conversion: hours = ms / 240_000.
 */

const MS_PER_GAME_HOUR = 240_000;

export const POEM_POWER_COOLDOWN_HOURS: Readonly<Record<string, number>> = Object.freeze({
  poem_1: 60_000 / MS_PER_GAME_HOUR,
  poem_2: 90_000 / MS_PER_GAME_HOUR,
  poem_3: 120_000 / MS_PER_GAME_HOUR,
  poem_4: 90_000 / MS_PER_GAME_HOUR,
  poem_5: 90_000 / MS_PER_GAME_HOUR,
  poem_6: 60_000 / MS_PER_GAME_HOUR,
  poem_7: 180_000 / MS_PER_GAME_HOUR,
  poem_8: 120_000 / MS_PER_GAME_HOUR,
  poem_9: 60_000 / MS_PER_GAME_HOUR,
  poem_10: 90_000 / MS_PER_GAME_HOUR,
  poem_11: 120_000 / MS_PER_GAME_HOUR,
  poem_12: 180_000 / MS_PER_GAME_HOUR,
  poem_13: 120_000 / MS_PER_GAME_HOUR,
  poem_14: 180_000 / MS_PER_GAME_HOUR,
  poem_15: 150_000 / MS_PER_GAME_HOUR,
  poem_16: 120_000 / MS_PER_GAME_HOUR,
  poem_17: 150_000 / MS_PER_GAME_HOUR,
  poem_18: 180_000 / MS_PER_GAME_HOUR,
  poem_19: 160_000 / MS_PER_GAME_HOUR,
  poem_20: 170_000 / MS_PER_GAME_HOUR,
  poem_21: 200_000 / MS_PER_GAME_HOUR,
  poem_tolpa: 150_000 / MS_PER_GAME_HOUR,
  poem_act6_01: 150_000 / MS_PER_GAME_HOUR,
  poem_act6_04: 180_000 / MS_PER_GAME_HOUR,
  poem_act6_05: 180_000 / MS_PER_GAME_HOUR,
  poem_act6_07: 200_000 / MS_PER_GAME_HOUR,
  poem_act7_ending: 200_000 / MS_PER_GAME_HOUR,
});

/** Fallback cooldown for poems without an explicit power definition. */
export const DEFAULT_POEM_POWER_COOLDOWN_HOURS = 60_000 / MS_PER_GAME_HOUR;

/**
 * Resolve the cooldown (in-game hours) for a poem power.
 * Falls back to {@link DEFAULT_POEM_POWER_COOLDOWN_HOURS} if the poem has no
 * registered power — this preserves the previous hardcoded behavior for
 * unknown poems so existing saves never soft-lock.
 */
export function getPoemPowerCooldownHours(poemId: string): number {
  return POEM_POWER_COOLDOWN_HOURS[poemId] ?? DEFAULT_POEM_POWER_COOLDOWN_HOURS;
}

/* ─── Backward-compatible aliases (ms) ─── */

/** @deprecated Use POEM_POWER_COOLDOWN_HOURS instead. */
export const POEM_POWER_COOLDOWN_MS: Readonly<Record<string, number>> = Object.freeze(
  Object.fromEntries(
    Object.entries(POEM_POWER_COOLDOWN_HOURS).map(([k, v]) => [k, v * MS_PER_GAME_HOUR]),
  ) as Record<string, number>,
);

/** @deprecated Use DEFAULT_POEM_POWER_COOLDOWN_HOURS instead. */
export const DEFAULT_POEM_POWER_COOLDOWN_MS = DEFAULT_POEM_POWER_COOLDOWN_HOURS * MS_PER_GAME_HOUR;

/** @deprecated Use getPoemPowerCooldownHours instead. */
export function getPoemPowerCooldownMs(poemId: string): number {
  return getPoemPowerCooldownHours(poemId) * MS_PER_GAME_HOUR;
}
