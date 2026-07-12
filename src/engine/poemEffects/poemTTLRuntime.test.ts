import { describe, expect, it } from 'vitest';
import {
  applyExplorationPoemCombatBridge,
  listLivePoemTTLDisplayEntries,
  scaleStressWithPoemEffects,
} from '@/engine/poemEffects/poemTTLRuntime';
import type { CombatState } from '@/engine/combat/types';
import { initCombatRngForEncounter } from '@/engine/combat/combatRng';
import type { PlayerState } from '@/shared/types/game';

const BASE_COMBAT: CombatState = {
  enemy: {
    type: 'system_daemon',
    name: 'Test',
    emoji: '👾',
    maxHp: 50,
    hp: 50,
    attack: 8,
    defense: 4,
    speed: 5,
    targetsStat: 'logic',
    lootTable: [],
    xpReward: 10,
    specialCooldown: 0,
  },
  playerHp: 100,
  playerMaxHp: 100,
  turn: 1,
  isPlayerTurn: true,
  playerDefending: false,
  enemyDefending: false,
  log: [{ turn: 0, text: 'start', type: 'info' }],
  status: 'active',
  powerCooldowns: {},
  enemyDefenseReduction: 0,
  doubleAttack: false,
  buffs: [],
  fleeAttempts: 0,
  _nextBuffId: 1,
  comboCount: 0,
  maxCombo: 0,
  lastCritical: false,
  lastPoemPowersUsed: [null, null],
  lastUsedPoemId: null,
  rng: initCombatRngForEncounter({} as PlayerState, 'system_daemon'),
};

describe('scaleStressWithPoemEffects', () => {
  it('halves positive stress while stone_skin_active is live', () => {
    const now = 1_000;
    const scaled = scaleStressWithPoemEffects(11, {
      stone_skin_active: {
        key: 'stone_skin_active',
        poemId: 'poem_10',
        expiryTimestamp: now + 5_000,
      },
    });
    expect(scaled).toBe(6);
  });

  it('does not alter negative stress relief', () => {
    expect(scaleStressWithPoemEffects(-15, {})).toBe(-15);
  });
});

describe('listLivePoemTTLDisplayEntries', () => {
  it('returns live flags sorted by soonest expiry with display metadata', () => {
    const now = 10_000;
    const entries = listLivePoemTTLDisplayEntries(
      {
        guiding_star_active: {
          key: 'guiding_star_active',
          poemId: 'poem_3',
          expiryTimestamp: now + 30_000,
        },
        stone_skin_active: {
          key: 'stone_skin_active',
          poemId: 'poem_10',
          expiryTimestamp: now + 5_000,
        },
        poem_hint_exit_glow_active: {
          key: 'poem_hint_exit_glow_active',
          poemId: 'poem_3',
          expiryTimestamp: now + 20_000,
        },
        expired_flag: {
          key: 'expired_flag',
          poemId: 'poem_1',
          expiryTimestamp: now - 1,
        },
      },
      now,
    );

    expect(entries).toHaveLength(2);
    expect(entries[0]?.flagKey).toBe('stone_skin_active');
    expect(entries[0]?.name).toBe('Каменная Кожа');
    expect(entries[1]?.flagKey).toBe('guiding_star_active');
  });
});

describe('applyExplorationPoemCombatBridge', () => {
  it('applies opening buffs from live exploration TTL flags', () => {
    const now = 50_000;
    const next = applyExplorationPoemCombatBridge(BASE_COMBAT, {
      breakthrough_active: {
        key: 'breakthrough_active',
        poemId: 'poem_8',
        expiryTimestamp: now + 10_000,
      },
      jester_word_active: {
        key: 'jester_word_active',
        poemId: 'poem_9',
        expiryTimestamp: now + 10_000,
      },
    });

    expect(next.buffs).toHaveLength(2);
    expect(next.log).toHaveLength(BASE_COMBAT.log.length + 1);
    expect(next.log.at(-1)?.text).toContain('2 сил стихов');
  });

  it('keeps a single log line for one bridgeable TTL flag', () => {
    const now = 50_000;
    const next = applyExplorationPoemCombatBridge(BASE_COMBAT, {
      stone_skin_active: {
        key: 'stone_skin_active',
        poemId: 'poem_10',
        expiryTimestamp: now + 10_000,
      },
    });

    expect(next.buffs).toHaveLength(1);
    expect(next.log.at(-1)?.text).toContain('Каменная кожа');
  });

  it('returns unchanged state when no bridgeable TTL flags are live', () => {
    const next = applyExplorationPoemCombatBridge(BASE_COMBAT, {});
    expect(next.buffs).toHaveLength(0);
    expect(next.log).toHaveLength(BASE_COMBAT.log.length);
  });
});
