import { describe, expect, it, vi } from 'vitest';
import type { StoryEffect } from '@/shared/types/game';
import type { MinigameCompletePayload } from '@/engine/events/minigameEvents';
import {
  claimMinigameRewards,
  completeMinigame,
  shouldApplyMinigameEventRewards,
  tryApplyMinigameEventRewards,
} from './claimMinigameRewards';

describe('shouldApplyMinigameEventRewards', () => {
  it('blocks apply when producer already claimed', () => {
    expect(
      shouldApplyMinigameEventRewards({
        rewardsApplied: true,
        reward: [{ type: 'addXp', value: 10 }],
      }),
    ).toBe(false);
  });

  it('allows legacy payloads without rewardsApplied', () => {
    expect(
      shouldApplyMinigameEventRewards({
        reward: [{ type: 'addXp', value: 10 }],
      }),
    ).toBe(true);
  });
});

describe('claimMinigameRewards', () => {
  it('applies once per claimKey', () => {
    const claimedKeys = new Set<string>();
    const apply = vi.fn();
    const rewards: StoryEffect[] = [{ type: 'addXp', value: 25 }];

    expect(claimMinigameRewards({ claimKey: 'quiz:1', rewards, apply, claimedKeys })).toEqual({
      claimed: true,
      applied: true,
    });
    expect(claimMinigameRewards({ claimKey: 'quiz:1', rewards, apply, claimedKeys })).toEqual({
      claimed: false,
      applied: false,
    });
    expect(apply).toHaveBeenCalledTimes(1);
    expect(apply).toHaveBeenCalledWith(rewards);
  });
});

describe('completeMinigame — XP/quest apply once', () => {
  it('applies XP once even if a listener tries to re-apply payload.reward', () => {
    const appliedBatches: StoryEffect[][] = [];
    const apply = (effects: StoryEffect[]) => {
      appliedBatches.push(effects);
    };
    const claimedKeys = new Set<string>();
    const objectiveHandler = vi.fn();
    const emits: MinigameCompletePayload[] = [];

    const result = completeMinigame({
      gameType: 'quiz',
      success: true,
      claimKey: 'session-quiz-1',
      claimedKeys,
      rewards: [{ type: 'addXp', value: 25 }],
      apply,
      emit: (payload) => {
        emits.push(payload);
        // QuestTracker / MinigameQuestBridge path — objectives only
        if (payload.success) {
          objectiveHandler(payload.gameType);
        }
        // Latent dual-path: naive listener tries applyEffects(payload.reward)
        tryApplyMinigameEventRewards(payload, apply, claimedKeys, 'session-quiz-1');
      },
    });

    expect(result.applied).toBe(true);
    expect(result.payload.rewardsApplied).toBe(true);
    expect(appliedBatches).toHaveLength(1);
    expect(appliedBatches[0]).toEqual([{ type: 'addXp', value: 25 }]);
    expect(objectiveHandler).toHaveBeenCalledTimes(1);
    expect(objectiveHandler).toHaveBeenCalledWith('quiz');
    expect(emits).toHaveLength(1);
  });

  it('still emits for quests when rewards list is empty', () => {
    const apply = vi.fn();
    const objectiveHandler = vi.fn();

    completeMinigame({
      gameType: 'codebreaker',
      success: false,
      apply,
      emit: (payload) => {
        if (payload.success) objectiveHandler(payload.gameType);
      },
    });

    expect(apply).not.toHaveBeenCalled();
    expect(objectiveHandler).not.toHaveBeenCalled();
  });

  it('emits again on duplicate claim but does not double XP', () => {
    const apply = vi.fn();
    const claimedKeys = new Set<string>();
    const emit = vi.fn();
    const rewards: StoryEffect[] = [{ type: 'addXp', value: 10 }];

    completeMinigame({
      gameType: 'hacking',
      success: true,
      claimKey: 'hack-1',
      claimedKeys,
      rewards,
      apply,
      emit,
    });
    completeMinigame({
      gameType: 'hacking',
      success: true,
      claimKey: 'hack-1',
      claimedKeys,
      rewards,
      apply,
      emit,
    });

    expect(apply).toHaveBeenCalledTimes(1);
    expect(emit).toHaveBeenCalledTimes(2);
  });
});
