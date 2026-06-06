import { useEffect } from 'react';
import { useGameStore } from '@/store/gameStore';
import { useOrchestratorOverlay } from '@/store/selectors';

/** Auto-skip intro via useEffect (avoids render-phase mutation). */
export function IntroAutoSkip() {
  const { introSeen, mode } = useOrchestratorOverlay();

  useEffect(() => {
    if (mode === 'intro' && introSeen) {
      useGameStore.getState().setMode('exploration');
    }
  }, [mode, introSeen]);

  return null;
}
