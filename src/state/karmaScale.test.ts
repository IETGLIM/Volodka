import { describe, it, expect, beforeEach } from 'vitest';

import { usePlayerStore } from '@/state/playerStore';
import { statsEngine } from '@/engine/StatsEngine';
import { matchChoiceCondition, matchDialogueCondition } from '@/game/conditions/ConditionMatcher';
import { compactPlayerStateForSave } from '@/lib/persistedGameSnapshot';
import type { PlayerState } from '@/data/types';
import { INITIAL_PLAYER } from '@/state/playerStore';

function minimalPlayer(over: Partial<PlayerState>): PlayerState {
  return { ...INITIAL_PLAYER, ...over } as PlayerState;
}

describe('karma scale (фаза C)', () => {
  beforeEach(() => {
    usePlayerStore.getState().resetPlayer();
  });

  it('последовательные addStat karma не выходят за 0–100 (сценарий «несколько шагов»)', () => {
    const add = usePlayerStore.getState().addStat;
    add('karma', 8);
    add('karma', -3);
    add('karma', 5);
    add('karma', -10);
    add('karma', 2);
    expect(usePlayerStore.getState().playerState.karma).toBe(52);
    for (let i = 0; i < 30; i++) add('karma', 5);
    expect(usePlayerStore.getState().playerState.karma).toBe(100);
    for (let j = 0; j < 40; j++) add('karma', -5);
    expect(usePlayerStore.getState().playerState.karma).toBe(0);
  });

  it('deserializePlayerState клампит карму при загрузке', () => {
    usePlayerStore.getState().deserializePlayerState({ karma: 999 });
    expect(usePlayerStore.getState().playerState.karma).toBe(100);
    usePlayerStore.getState().deserializePlayerState({ karma: -40 });
    expect(usePlayerStore.getState().playerState.karma).toBe(0);
  });

  it('снимок save: карма сохраняется через JSON как в local payload', () => {
    const ps = minimalPlayer({ karma: 73 });
    const compact = compactPlayerStateForSave(ps);
    const json = JSON.parse(JSON.stringify(compact)) as PlayerState;
    expect(json.karma).toBe(73);
  });

  it('ChoiceCondition stat karma и DialogueCondition minKarma', () => {
    const baseCtx = {
      playerState: minimalPlayer({ karma: 72 }),
      npcRelations: [],
      flags: {},
      inventory: [],
      visitedNodes: [],
      skills: INITIAL_PLAYER.skills,
      activeQuestIds: [],
      completedQuestIds: [],
    };
    expect(matchChoiceCondition({ stat: 'karma', min: 70 }, baseCtx).met).toBe(true);
    expect(matchChoiceCondition({ stat: 'karma', min: 80 }, baseCtx).met).toBe(false);
    expect(matchDialogueCondition({ minKarma: 70 }, baseCtx)).toBe(true);
    expect(matchDialogueCondition({ minKarma: 80 }, baseCtx)).toBe(false);
  });

  it('StatsEngine: подсказка при высокой карме; без токена redemption-path', () => {
    const high = statsEngine.getDerivedEffects(minimalPlayer({ karma: 75 }));
    expect(high.narrativeHints.some((h) => h.includes('карма'))).toBe(true);
    expect(high.availableActions).not.toContain('redemption-path');
  });
});
