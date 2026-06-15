import { useSyncExternalStore } from 'react';
import { eventBus, type EventBusUnsubscribe } from '@/engine/EventBus';
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

const listeners = new Set<() => void>();
let sceneEnterUnsub: EventBusUnsubscribe | null = null;
let sceneLoadedUnsub: EventBusUnsubscribe | null = null;

function notifyListeners(): void {
  for (const listener of listeners) listener();
}

function attachSceneBusListeners(): void {
  if (sceneEnterUnsub) return;
  sceneEnterUnsub = eventBus.on('scene:enter', notifyListeners);
  sceneLoadedUnsub = eventBus.on('scene:loaded', notifyListeners);
}

function detachSceneBusListeners(): void {
  sceneEnterUnsub?.();
  sceneEnterUnsub = null;
  sceneLoadedUnsub?.();
  sceneLoadedUnsub = null;
}

function subscribe(onStoreChange: () => void): () => void {
  const unsubs = [
    useGameStore.subscribe(onStoreChange),
    subscribeEncounterPresentation(onStoreChange),
  ];
  listeners.add(onStoreChange);
  if (listeners.size === 1) attachSceneBusListeners();
  return () => {
    unsubs.forEach((unsub) => unsub());
    listeners.delete(onStoreChange);
    if (listeners.size === 0) detachSceneBusListeners();
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
