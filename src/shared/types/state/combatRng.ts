/* ─── Combat RNG persisted / runtime state shapes ─── */

export interface CombatRngPityState {
  /** Rolls since last crit — hook for future bad-luck protection. */
  rollsSinceCrit: number;
  /** Rolls since last hit — hook for future miss pity. */
  rollsSinceHit: number;
}

export interface CombatRngState {
  /** Mulberry32 internal state (unsigned 32-bit). */
  state: number;
  /** Monotonic roll counter within this combat encounter. */
  rolls: number;
  pity: CombatRngPityState;
}

/** Subset of player state used to derive per-encounter combat RNG. */
export type CombatRngPlayerMeta = {
  rngSeed?: number;
  combatEncounterSeq?: number;
};
