import { eventBus } from '@/engine/EventBus';
import {
  launchMinigameFromHub,
  type LaunchMinigameResult,
} from '@/engine/minigame/hub/minigameHubPresentation';
import type { MinigameHubGameType } from '@/engine/minigame/hub/minigameHubConstants';

export function requestMinigameLaunch(gameType: MinigameHubGameType): LaunchMinigameResult {
  return launchMinigameFromHub(gameType, {
    emit: (event, payload) => eventBus.emit(event, payload),
    hasOpenHandler: () => eventBus.hasHandlers('minigame:open'),
  });
}
