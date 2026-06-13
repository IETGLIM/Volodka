import { describe, expect, it } from 'vitest';
import type { CombatBuff, CombatState } from './types';
import { addBuff, createBuff, getEnemyDefenseReduction } from './buffSystem';

function minimalState(buffs: CombatBuff[] = [], nextBuffId = 1): CombatState {
  return {
    buffs,
    _nextBuffId: nextBuffId,
  } as CombatState;
}

function makeBuff(
  id: string,
  kind: 'buff' | 'debuff',
  target: 'player' | 'enemy',
  effectType: 'damage_reduction' | 'defense_reduction' = 'damage_reduction',
): CombatBuff {
  return {
    id,
    name: id,
    source: id,
    kind,
    target,
    duration: 2,
    effect: { type: effectType, value: 0.5 },
  };
}

describe('getEnemyDefenseReduction', () => {
  it('reads buffs only — ignores mirrored enemyDefenseReduction field', () => {
    const buff = makeBuff('poem_1', 'debuff', 'enemy', 'defense_reduction');
    const state = {
      ...minimalState([buff]),
      enemyDefenseReduction: 0.5,
    } as CombatState;

    expect(getEnemyDefenseReduction(state)).toBe(0.5);
  });
});

describe('addBuff slot limits', () => {
  it('does not evict player buffs when adding a player debuff', () => {
    const state = minimalState([
      makeBuff('buff_a', 'buff', 'player'),
      makeBuff('buff_b', 'buff', 'player'),
    ]);

    const debuff = createBuff(
      state,
      'Enemy Curse',
      'enemy_special',
      'debuff',
      'player',
      2,
      { type: 'defense_reduction', value: 0.3 },
    );
    const next = addBuff(state, debuff);

    expect(next.buffs.filter((b) => b.kind === 'buff' && b.target === 'player').map((b) => b.id)).toEqual([
      'buff_a',
      'buff_b',
    ]);
    expect(next.buffs.some((b) => b.kind === 'debuff' && b.target === 'player')).toBe(true);
  });

  it('evicts oldest debuff when a third debuff is added to the same target', () => {
    const state = minimalState([
      makeBuff('debuff_a', 'debuff', 'player', 'defense_reduction'),
      makeBuff('debuff_b', 'debuff', 'player', 'defense_reduction'),
    ]);

    const debuff = createBuff(
      state,
      'Third Curse',
      'enemy_special_2',
      'debuff',
      'player',
      2,
      { type: 'defense_reduction', value: 0.2 },
    );
    const next = addBuff(state, debuff);

    const playerDebuffs = next.buffs.filter((b) => b.kind === 'debuff' && b.target === 'player');
    expect(playerDebuffs).toHaveLength(2);
    expect(playerDebuffs.some((b) => b.id === 'debuff_a')).toBe(false);
    expect(playerDebuffs.some((b) => b.id === 'debuff_b')).toBe(true);
    expect(playerDebuffs.some((b) => b.source === 'enemy_special_2')).toBe(true);
  });
});
