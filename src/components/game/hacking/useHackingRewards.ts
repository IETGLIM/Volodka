import { useCallback, useMemo } from 'react';
import { useGameStore } from '@/store/gameStore';
import { eventBus } from '@/engine/EventBus';
import { calculateHackingRewards, clientRandom } from '@/engine/minigame/hacking/hackingGameUtils';
import type { HackingGamePhase, HackingGameState } from '@/engine/minigame/hacking/hackingGameTypes';

export function useHackingRewards(
  gameState: Pick<HackingGameState, 'dataCollected' | 'bandwidth'> & { phase: HackingGamePhase },
  onClose: () => void,
) {
  const rewards = useMemo(() => {
    if (gameState.phase !== 'won') return null;
    return calculateHackingRewards(gameState, clientRandom());
  }, [gameState.phase, gameState.dataCollected, gameState.bandwidth]);

  const claimRewards = useCallback(() => {
    if (!rewards) return;
    const store = useGameStore.getState();

    store.addXp(rewards.totalXP);
    store.addKarma(rewards.karmaReward);
    store.addSkill('coding', rewards.codingSkill);
    store.setFlag('hacking_complete', true);

    eventBus.emit('minigame:complete', {
      gameType: 'hacking',
      success: true,
      reward: [
        { type: 'addXp', value: rewards.totalXP },
        { type: 'addKarma', value: rewards.karmaReward },
      ],
    });

    onClose();
  }, [onClose, rewards]);

  return { rewards, claimRewards };
}
