import { getExplorationAmbientStressPerTick } from '@/lib/explorationAtmosphere';
import { useGameStore } from '@/store/gameStore';

/** DOM `setInterval`; без `ReturnType<typeof setInterval>` (конфликт Node `Timeout` vs `number`). */
let intervalId: number | null = null;

function clearAmbientInterval(): void {
  if (intervalId != null) {
    window.clearInterval(intervalId);
    intervalId = null;
  }
}

function isExplorationGame(state: ReturnType<typeof useGameStore.getState>): boolean {
  return state.phase === 'game' && state.gameMode === 'exploration';
}

/** Один интервал на сессию обхода; тик читает актуальную сцену из стора. */
function ensureAmbientInterval(): void {
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
  ensureAmbientInterval();
  const unsub = useGameStore.subscribe((state, prevState) => {
    const exploring = isExplorationGame(state);
    const wasExploring = prevState ? isExplorationGame(prevState) : exploring;
    if (exploring !== wasExploring) {
      clearAmbientInterval();
      ensureAmbientInterval();
    }
  });
  return () => {
    unsub();
    clearAmbientInterval();
  };
}
