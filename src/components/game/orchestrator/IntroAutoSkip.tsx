import { useEffect } from 'react';
import { useGameStore } from '@/store/gameStore';
import { useOrchestratorShell } from '@/store/selectors';

/** Auto-skip intro via useEffect (avoids render-phase mutation). */
export function IntroAutoSkip() {
  const { introSeen, mode } = useOrchestratorShell();

  useEffect(() => {
    // Returning visitors (poem already seen) skip the intro straight to the
    // main menu rather than dead-ending into exploration.
    if (mode === 'intro' && introSeen) {
      useGameStore.getState().setMainMenuOpen(true);
    }
  }, [mode, introSeen]);

  return null;
}
