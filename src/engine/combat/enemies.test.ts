import { describe, expect, it } from 'vitest';
import type { CombatEnemy, CombatState } from './types';
import { ENEMY_TEMPLATES } from './enemies';
import { getPlayerVulnerability } from './buffSystem';

function minimalCombatState(overrides: Partial<CombatState> = {}): CombatState {
  return {
    turn: 1,
    log: [],
    buffs: [],
    _nextBuffId: 1,
    playerHp: 50,
    ...overrides,
  } as CombatState;
}

const testEnemy: CombatEnemy = {
  type: 'system_daemon',
  name: 'Системный Демон',
  emoji: '👾',
  maxHp: 40,
  hp: 40,
  attack: 12,
  defense: 4,
  speed: 8,
  targetsStat: 'logic',
  lootTable: [],
  xpReward: 25,
  specialCooldown: 0,
};

describe('daemon_digital_prison', () => {
  const special = ENEMY_TEMPLATES.system_daemon.specialAttacks.find(
    (a) => a.id === 'daemon_digital_prison',
  );

  it('is defined on system_daemon', () => {
    expect(special).toBeDefined();
    expect(special?.name).toBe('Цифровая Тюрьма');
  });

  it('applies defense_reduction debuff to player (not attack_boost to enemy)', () => {
    const state = minimalCombatState();
    const next = special!.execute(state, testEnemy);

    const prisonBuff = next.buffs.find((b) => b.source === 'daemon_digital_prison');
    expect(prisonBuff).toMatchObject({
      kind: 'debuff',
      target: 'player',
      duration: 2,
      effect: { type: 'defense_reduction', value: 0.3 },
    });
    expect(next.buffs.some((b) => b.effect.type === 'attack_boost' && b.target === 'enemy')).toBe(false);
    expect(getPlayerVulnerability(next)).toBe(0.3);
  });
});
