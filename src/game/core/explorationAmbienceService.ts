import { getExplorationAmbientStressPerTick } from '@/lib/explorationAtmosphere';
import { useGameStore } from '@/state';
import { useAppStore } from '@/state/appStore';

/** DOM `setInterval`; без `ReturnType<typeof setInterval>` (конфликт Node `Timeout` vs `number`). */
let intervalId: number | null = null;

function clearAmbientInterval(): void {
  if (intervalId != null) {
    window.clearInterval(intervalId);
    intervalId = null;
  }
}

function isExplorationGame(gameState: ReturnType<typeof useGameStore.getState>): boolean {
  return useAppStore.getState().phase === 'game' && gameState.gameMode === 'exploration';
}

function syncAmbientInterval(): void {
  if (!isExplorationGame(useGameStore.getState())) {
    clearAmbientInterval();
    return;
  }
  if (intervalId != null) return;
  intervalId = window.setInterval(() => {
    const st = useGameStore.getState();
    if (!isExplorationGame(st)) return;
    const sceneId = st.exploration.currentSceneId;
    const d = getExplorationAmbientStressPerTick(sceneId, st.exploration.timeOfDay);
    if (d > 0) st.addStress(d);
  }, 3200);
}

export function startExplorationAmbienceService(): () => void {
  syncAmbientInterval();
  const unsubGame = useGameStore.subscribe(() => {
    clearAmbientInterval();
    syncAmbientInterval();
  });
  const unsubApp = useAppStore.subscribe(() => {
    clearAmbientInterval();
    syncAmbientInterval();
  });
  return () => {
    unsubGame();
    unsubApp();
    clearAmbientInterval();
  };
}
