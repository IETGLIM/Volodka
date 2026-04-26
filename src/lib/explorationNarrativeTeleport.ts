import type { SceneId } from '@/data/types';
import type { PlayerPosition } from '@/data/rpgTypes';
import { useGameStore } from '@/state';

/**
 * Одна запись в стор: `currentSceneId` + `playerPosition` + `lastSceneTransition`.
 * Исключает кадр, где React уже перерисовал новую сцену со старой позицией (провал сквозь пол / «пустота»).
 */
export function explorationNarrativeTeleport(sceneId: SceneId, playerPosition: PlayerPosition): void {
  useGameStore.setState((s) => ({
    exploration: {
      ...s.exploration,
      currentSceneId: sceneId,
      playerPosition: { ...playerPosition },
      lastSceneTransition: Date.now(),
    },
  }));
}
