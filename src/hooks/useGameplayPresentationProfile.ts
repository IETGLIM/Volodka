import { useSyncExternalStore } from 'react';
import { eventBus } from '@/engine/EventBus';
import { useGameStore } from '@/store/gameStore';
import { getGamePhase } from '@/shared/gamePhase';
import { isSceneTransitionInProgress } from '@/engine/core/SceneTransitionManager';
import {
  isEncounterPresentationActive,
  subscribeEncounterPresentation,
} from '@/engine/combat/encounterPresentation';

export type GameplayPresentationProfile =
  | 'exploration'
  | 'narrative'
  | 'combat'
  | 'encounter'
  | 'transition';

function subscribe(onStoreChange: () => void): () => void {
  const unsubs = [
    useGameStore.subscribe(onStoreChange),
    subscribeEncounterPresentation(onStoreChange),
    eventBus.on('scene:enter', onStoreChange),
    eventBus.on('scene:loaded', onStoreChange),
  ];
  return () => {
    unsubs.forEach((unsub) => unsub());
  };
}

function getSnapshot(): GameplayPresentationProfile {
  if (isSceneTransitionInProgress()) return 'transition';
  if (isEncounterPresentationActive()) return 'encounter';

  const state = useGameStore.getState();
  const phase = getGamePhase(state);

  if (phase === 'combat') return 'combat';
  if (phase === 'cutscene' || state.showStoryOverlay) return 'narrative';
  return 'exploration';
}

/** Single HUD mount profile — exploration | narrative | combat | encounter | transition. */
export function useGameplayPresentationProfile(): GameplayPresentationProfile {
  return useSyncExternalStore(subscribe, getSnapshot, getSnapshot);
}

export function isExplorationHudProfile(profile: GameplayPresentationProfile): boolean {
  return profile === 'exploration';
}
