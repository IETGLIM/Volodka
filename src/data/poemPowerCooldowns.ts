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
 * Values are in milliseconds.
 */

export const POEM_POWER_COOLDOWN_MS: Readonly<Record<string, number>> = Object.freeze({
  poem_1: 60_000,
  poem_2: 90_000,
  poem_3: 120_000,
  poem_4: 90_000,
  poem_5: 90_000,
  poem_6: 60_000,
  poem_7: 180_000,
  poem_8: 120_000,
  poem_9: 60_000,
  poem_10: 90_000,
  poem_11: 120_000,
  poem_12: 180_000,
  poem_13: 120_000,
  poem_14: 180_000,
  poem_15: 150_000,
  poem_16: 120_000,
  poem_17: 150_000,
  poem_18: 180_000,
  poem_19: 160_000,
  poem_20: 170_000,
  poem_21: 200_000,
  poem_tolpa: 150_000,
  poem_act6_04: 180_000,
  poem_act6_05: 180_000,
  poem_act6_07: 200_000,
});

/** Fallback cooldown for poems without an explicit power definition. */
export const DEFAULT_POEM_POWER_COOLDOWN_MS = 60_000;

/**
 * Resolve the cooldown (ms) for a poem power.
 * Falls back to {@link DEFAULT_POEM_POWER_COOLDOWN_MS} if the poem has no
 * registered power — this preserves the previous hardcoded behavior for
 * unknown poems so existing saves never soft-lock.
 */
export function getPoemPowerCooldownMs(poemId: string): number {
  return POEM_POWER_COOLDOWN_MS[poemId] ?? DEFAULT_POEM_POWER_COOLDOWN_MS;
}
