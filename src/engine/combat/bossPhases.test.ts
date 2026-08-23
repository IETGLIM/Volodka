import { describe, expect, it } from 'vitest';
import {
  getBossPhases,
  getCurrentBossPhase,
  getActiveBossPhase,
  checkBossPhaseTransition,
  getBossPhaseDamageMultiplier,
  getBossPhaseSpeedMultiplier,
  getBossPhaseThresholds,
} from './bossPhases';
import type { CombatEnemy } from '@/shared/types/game';

/* ═══════════════════════════════════════════════════════════════
   Helpers
   ═══════════════════════════════════════════════════════════════ */

function makeEnemy(overrides: Partial<CombatEnemy> = {}): CombatEnemy {
  return {
    type: 'boss_catacombs_keeper',
    name: 'Хранитель Катакомб',
    emoji: '💀',
    hp: 500,
    maxHp: 500,
    attack: 20,
    defense: 14,
    speed: 10,
    targetsStat: 'karma',
    lootTable: [],
    xpReward: 550,
    specialCooldown: 0,
    ...overrides,
  };
}

/** Enemy with HP set to a fraction of maxHp. */
function enemyAtHpFraction(type: CombatEnemy['type'], fraction: number): CombatEnemy {
  return makeEnemy({ type, hp: Math.floor(500 * fraction) });
}

const ALL_BOSSES = [
  'boss_neuro_sys',
  'boss_dream_eater',
  'boss_final_code',
  'boss_catacombs_keeper',
] as const;

/* ═══════════════════════════════════════════════════════════════
   Phase configuration lookup
   ═══════════════════════════════════════════════════════════════ */

describe('getBossPhases', () => {
  it('returns a 3-phase config for every boss type', () => {
    for (const bossType of ALL_BOSSES) {
      const phases = getBossPhases(bossType);
      expect(phases, bossType).not.toBeNull();
      expect(phases).toHaveLength(3);
      expect(phases!.map((p) => p.phase)).toEqual([0, 1, 2]);
      // All phase descriptions are non-empty Russian strings
      for (const p of phases!) {
        expect(p.description.length).toBeGreaterThan(0);
        expect(p.flashColor).toMatch(/^#/);
      }
    }
  });

  it('returns null for non-boss enemy types', () => {
    expect(getBossPhases('system_daemon')).toBeNull();
    expect(getBossPhases('corporate_golem')).toBeNull();
  });

  it('uses the 100/60/30 threshold structure', () => {
    for (const bossType of ALL_BOSSES) {
      const phases = getBossPhases(bossType)!;
      expect(phases[0].hpUpperBound).toBe(1.0);
      expect(phases[0].hpLowerBound).toBe(0.6);
      expect(phases[1].hpUpperBound).toBe(0.6);
      expect(phases[1].hpLowerBound).toBe(0.3);
      expect(phases[2].hpUpperBound).toBe(0.3);
      expect(phases[2].hpLowerBound).toBe(0.0);
    }
  });
});

/* ═══════════════════════════════════════════════════════════════
   Phase resolution from HP
   ═══════════════════════════════════════════════════════════════ */

describe('getCurrentBossPhase', () => {
  it('phase 0 while HP is above 60%', () => {
    expect(getCurrentBossPhase(enemyAtHpFraction('boss_catacombs_keeper', 1.0))).toBe(0);
    expect(getCurrentBossPhase(enemyAtHpFraction('boss_catacombs_keeper', 0.99))).toBe(0);
    expect(getCurrentBossPhase(enemyAtHpFraction('boss_catacombs_keeper', 0.61))).toBe(0);
  });

  it('phase 1 at exactly 60% (threshold is inclusive)', () => {
    expect(getCurrentBossPhase(enemyAtHpFraction('boss_catacombs_keeper', 0.6))).toBe(1);
    expect(getCurrentBossPhase(enemyAtHpFraction('boss_catacombs_keeper', 0.31))).toBe(1);
  });

  it('phase 2 at exactly 30% and below', () => {
    expect(getCurrentBossPhase(enemyAtHpFraction('boss_catacombs_keeper', 0.3))).toBe(2);
    expect(getCurrentBossPhase(enemyAtHpFraction('boss_catacombs_keeper', 0.01))).toBe(2);
    expect(getCurrentBossPhase(enemyAtHpFraction('boss_catacombs_keeper', 0))).toBe(2);
  });

  it('returns 0 for non-boss enemies regardless of HP', () => {
    expect(getCurrentBossPhase(makeEnemy({ type: 'system_daemon', hp: 1, maxHp: 100 }))).toBe(0);
  });
});

describe('getActiveBossPhase', () => {
  it('returns the definition matching the current phase', () => {
    const phase = getActiveBossPhase(enemyAtHpFraction('boss_catacombs_keeper', 0.5));
    expect(phase?.phase).toBe(1);
    expect(phase?.damageMultiplier).toBe(1.3);
    expect(phase?.canSummonAdds).toBe(true);
  });

  it('returns null for non-boss enemies', () => {
    expect(getActiveBossPhase(makeEnemy({ type: 'system_daemon' }))).toBeNull();
  });
});

/* ═══════════════════════════════════════════════════════════════
   Transition detection
   ═══════════════════════════════════════════════════════════════ */

describe('checkBossPhaseTransition', () => {
  it('returns null when the phase has not changed', () => {
    expect(checkBossPhaseTransition(enemyAtHpFraction('boss_catacombs_keeper', 0.9), 0)).toBeNull();
    expect(checkBossPhaseTransition(enemyAtHpFraction('boss_catacombs_keeper', 0.5), 1)).toBeNull();
    expect(checkBossPhaseTransition(enemyAtHpFraction('boss_catacombs_keeper', 0.2), 2)).toBeNull();
  });

  it('detects the 100→60% transition into phase 1', () => {
    const transition = checkBossPhaseTransition(enemyAtHpFraction('boss_catacombs_keeper', 0.5), 0);
    expect(transition).not.toBeNull();
    expect(transition!.phase).toBe(1);
    expect(transition!.damageMultiplier).toBe(1.3);
    expect(transition!.invulnerabilityOnEnter).toBe(true);
  });

  it('detects the 60→30% transition into phase 2', () => {
    const transition = checkBossPhaseTransition(enemyAtHpFraction('boss_catacombs_keeper', 0.2), 1);
    expect(transition).not.toBeNull();
    expect(transition!.phase).toBe(2);
    expect(transition!.damageMultiplier).toBe(1.6);
  });

  it('returns null for non-boss enemies', () => {
    expect(checkBossPhaseTransition(makeEnemy({ type: 'system_daemon', hp: 10, maxHp: 100 }), 0)).toBeNull();
  });
});

/* ═══════════════════════════════════════════════════════════════
   Multipliers
   ═══════════════════════════════════════════════════════════════ */

describe('getBossPhaseDamageMultiplier', () => {
  it('catacombs keeper escalates 1.0 → 1.3 → 1.6', () => {
    expect(getBossPhaseDamageMultiplier(enemyAtHpFraction('boss_catacombs_keeper', 0.9))).toBe(1.0);
    expect(getBossPhaseDamageMultiplier(enemyAtHpFraction('boss_catacombs_keeper', 0.5))).toBe(1.3);
    expect(getBossPhaseDamageMultiplier(enemyAtHpFraction('boss_catacombs_keeper', 0.2))).toBe(1.6);
  });

  it('default-config bosses escalate 1.0 → 1.2 → 1.5', () => {
    expect(getBossPhaseDamageMultiplier(enemyAtHpFraction('boss_neuro_sys', 0.9))).toBe(1.0);
    expect(getBossPhaseDamageMultiplier(enemyAtHpFraction('boss_neuro_sys', 0.5))).toBe(1.2);
    expect(getBossPhaseDamageMultiplier(enemyAtHpFraction('boss_final_code', 0.2))).toBe(1.5);
  });

  it('returns 1.0 for non-boss enemies', () => {
    expect(getBossPhaseDamageMultiplier(makeEnemy({ type: 'system_daemon', hp: 1, maxHp: 100 }))).toBe(1.0);
  });
});

describe('getBossPhaseSpeedMultiplier', () => {
  it('catacombs keeper speeds up 1.0 → 1.2 → 1.5', () => {
    expect(getBossPhaseSpeedMultiplier(enemyAtHpFraction('boss_catacombs_keeper', 0.9))).toBe(1.0);
    expect(getBossPhaseSpeedMultiplier(enemyAtHpFraction('boss_catacombs_keeper', 0.5))).toBe(1.2);
    expect(getBossPhaseSpeedMultiplier(enemyAtHpFraction('boss_catacombs_keeper', 0.2))).toBe(1.5);
  });
});

/* ═══════════════════════════════════════════════════════════════
   UI thresholds (BossHealthBar pips)
   ═══════════════════════════════════════════════════════════════ */

describe('getBossPhaseThresholds', () => {
  it('returns the descending transition points for bosses', () => {
    for (const bossType of ALL_BOSSES) {
      expect(getBossPhaseThresholds(bossType), bossType).toEqual([0.6, 0.3]);
    }
  });

  it('returns null for non-boss enemy types', () => {
    expect(getBossPhaseThresholds('system_daemon')).toBeNull();
  });
});
