/* ─── Combat System — Boss Phase System (Task 4b-C2, integrated 3.3-b1) ───
 *
 * Defines phase thresholds, behavior changes, and transition logic
 * for multi-phase bosses (e.g. Хранитель Катакомб with 3 phases).
 *
 * Each phase defines:
 *   - HP threshold range (upper/lower bounds as fractions)
 *   - Damage multiplier (scales outgoing damage)
 *   - Speed multiplier (affects enemy speed stat + action pacing)
 *   - Whether to apply invulnerability frames during transition
 *   - Visual flash color for phase transition notification
 *   - Whether the phase can summon adds
 *
 * Consumed by CombatSystem.ts (enemy-turn damage pipeline + phase-transition
 * orchestration: multipliers, i-frames, adds, log/events) and by the
 * BossHealthBar phase-pips component (real phase thresholds).
 */

import type { CombatEnemy, EnemyType } from '@/shared/types/game';

/* ═══════════════════════════════════════════════════════════════
   Phase Definition
   ═══════════════════════════════════════════════════════════════ */

export interface BossPhaseDefinition {
  /** Phase index (0-based). */
  phase: number;
  /** Upper HP fraction threshold (inclusive). Phase is active when hp/maxHp ≤ this. */
  hpUpperBound: number;
  /** Lower HP fraction threshold (exclusive). Phase is active when hp/maxHp > this. */
  hpLowerBound: number;
  /** Damage multiplier applied to all outgoing enemy attacks in this phase. */
  damageMultiplier: number;
  /** Speed multiplier — affects turn order priority. */
  speedMultiplier: number;
  /** Whether a brief invulnerability window is granted on entering this phase. */
  invulnerabilityOnEnter: boolean;
  /** Duration of invulnerability in turns (if invulnerabilityOnEnter is true). */
  invulnerabilityTurns: number;
  /** Visual flash color for phase transition (hex). */
  flashColor: string;
  /** Whether this phase can spawn adds (used by special attack selection). */
  canSummonAdds: boolean;
  /** Phase description in Russian — for combat log entries. */
  description: string;
}

/* ═══════════════════════════════════════════════════════════════
   Phase Configuration per Boss
   ═══════════════════════════════════════════════════════════════ */

/** Хранитель Катакомб — 3 phases:
 *   Phase 0 (100–60%): Melee, standard attacks, damageMultiplier 1.0
 *   Phase 1 (60–30%): Summons adds, +0.3 damage, +1.2 speed
 *   Phase 2 (30–0%): Enrage, +0.6 damage, +1.5 speed */
const CATACOMBS_KEEPER_PHASES: BossPhaseDefinition[] = [
  {
    phase: 0,
    hpUpperBound: 1.0,
    hpLowerBound: 0.6,
    damageMultiplier: 1.0,
    speedMultiplier: 1.0,
    invulnerabilityOnEnter: false,
    invulnerabilityTurns: 0,
    flashColor: '#8b5cf6',
    canSummonAdds: false,
    description: 'Фаза 1: Ближний бой',
  },
  {
    phase: 1,
    hpUpperBound: 0.6,
    hpLowerBound: 0.3,
    damageMultiplier: 1.3,
    speedMultiplier: 1.2,
    invulnerabilityOnEnter: true,
    invulnerabilityTurns: 1,
    flashColor: '#a855f7',
    canSummonAdds: true,
    description: 'Фаза 2: Призыв теней',
  },
  {
    phase: 2,
    hpUpperBound: 0.3,
    hpLowerBound: 0.0,
    damageMultiplier: 1.6,
    speedMultiplier: 1.5,
    invulnerabilityOnEnter: true,
    invulnerabilityTurns: 1,
    flashColor: '#dc2626',
    canSummonAdds: false,
    description: 'Фаза 3: Ярость',
  },
];

/** Default 3-phase config for bosses without a custom definition.
 *  Uses the same 100/60/30 thresholds with generic multipliers. */
const DEFAULT_3_PHASE: BossPhaseDefinition[] = [
  {
    phase: 0, hpUpperBound: 1.0, hpLowerBound: 0.6,
    damageMultiplier: 1.0, speedMultiplier: 1.0,
    invulnerabilityOnEnter: false, invulnerabilityTurns: 0,
    flashColor: '#f59e0b', canSummonAdds: false,
    description: 'Фаза 1',
  },
  {
    phase: 1, hpUpperBound: 0.6, hpLowerBound: 0.3,
    damageMultiplier: 1.2, speedMultiplier: 1.1,
    invulnerabilityOnEnter: true, invulnerabilityTurns: 1,
    flashColor: '#ef4444', canSummonAdds: true,
    description: 'Фаза 2',
  },
  {
    phase: 2, hpUpperBound: 0.3, hpLowerBound: 0.0,
    damageMultiplier: 1.5, speedMultiplier: 1.3,
    invulnerabilityOnEnter: true, invulnerabilityTurns: 1,
    flashColor: '#dc2626', canSummonAdds: false,
    description: 'Фаза 3',
  },
];

/** Phase configuration lookup by boss enemy type. */
const BOSS_PHASE_MAP: Partial<Record<EnemyType, BossPhaseDefinition[]>> = {
  boss_catacombs_keeper: CATACOMBS_KEEPER_PHASES,
  boss_neuro_sys: DEFAULT_3_PHASE,
  boss_dream_eater: DEFAULT_3_PHASE,
  boss_final_code: DEFAULT_3_PHASE,
};

/* ═══════════════════════════════════════════════════════════════
   Phase Resolution
   ═══════════════════════════════════════════════════════════════ */

/** Get the phase definitions for a given boss type.
 *  Returns null for non-boss or unregistered types. */
export function getBossPhases(enemyType: EnemyType): BossPhaseDefinition[] | null {
  return BOSS_PHASE_MAP[enemyType] ?? null;
}

/** Determine the current phase index from enemy HP fraction.
 *  Returns 0 if no phase definitions exist (non-boss). */
export function getCurrentBossPhase(enemy: CombatEnemy): number {
  if (enemy.maxHp <= 0) return 0;
  const hpFrac = enemy.hp / enemy.maxHp;
  const phases = BOSS_PHASE_MAP[enemy.type];
  if (!phases) return 0;

  for (const p of phases) {
    if (hpFrac <= p.hpUpperBound && hpFrac > p.hpLowerBound) {
      return p.phase;
    }
  }
  // Edge case: HP exactly 0 → last phase
  return phases[phases.length - 1].phase;
}

/** Get the active phase definition for the current enemy HP. */
export function getActiveBossPhase(enemy: CombatEnemy): BossPhaseDefinition | null {
  const phases = BOSS_PHASE_MAP[enemy.type];
  if (!phases) return null;
  const currentPhase = getCurrentBossPhase(enemy);
  return phases.find(p => p.phase === currentPhase) ?? null;
}

/** Check if a boss has transitioned to a new phase based on HP change.
 *  Returns the new phase definition if a transition occurred, null otherwise.
 *  `previousPhase` is the phase index before the HP change. */
export function checkBossPhaseTransition(
  enemy: CombatEnemy,
  previousPhase: number,
): BossPhaseDefinition | null {
  const currentPhase = getCurrentBossPhase(enemy);
  if (currentPhase === previousPhase) return null;
  return getActiveBossPhase(enemy);
}

/** Get the damage multiplier for the current boss phase.
 *  Returns 1.0 for non-boss or unregistered types. */
export function getBossPhaseDamageMultiplier(enemy: CombatEnemy): number {
  const phase = getActiveBossPhase(enemy);
  return phase?.damageMultiplier ?? 1.0;
}

/** Get the speed multiplier for the current boss phase.
 *  Returns 1.0 for non-boss or unregistered types. */
export function getBossPhaseSpeedMultiplier(enemy: CombatEnemy): number {
  const phase = getActiveBossPhase(enemy);
  return phase?.speedMultiplier ?? 1.0;
}

/** HP fraction thresholds (descending) where a boss enters each phase —
 *  e.g. [0.6, 0.3] for a 100/60/30 boss. Used by the BossHealthBar pips so
 *  the visual phase markers match the ACTUAL mechanical phase boundaries.
 *  Returns null for non-boss / unregistered types. */
export function getBossPhaseThresholds(enemyType: EnemyType): number[] | null {
  const phases = BOSS_PHASE_MAP[enemyType];
  if (!phases || phases.length === 0) return null;
  // Phase 0's upper bound is always 1.0 — only the transition points matter.
  return phases.slice(1).map((p) => p.hpUpperBound);
}

/** Whether the boss is currently in invulnerability (just entered a new phase).
 *  This is a conceptual check — the actual invulnerability turn tracking
 *  is managed by the combat orchestrator using the phase's invulnerabilityTurns. */
export function isBossPhaseInvulnerable(enemy: CombatEnemy): boolean {
  const phase = getActiveBossPhase(enemy);
  return phase?.invulnerabilityOnEnter ?? false;
}
