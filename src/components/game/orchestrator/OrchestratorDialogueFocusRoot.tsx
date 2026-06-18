import type { ReactNode } from 'react';
import { useGamePanelStackOpen } from '@/components/a11y/usePanelFocusTrapActive';
import { useOrchestratorNarrativeOverlay, useOrchestratorShell } from '@/store/selectors';
import { useCinematicInterstitialActive } from '@/hooks/useCinematicInterstitialActive';

/** Applies dialogue-focus CSS only when narrative overlay state changes. */
export function OrchestratorDialogueFocusRoot({ children }: { children: ReactNode }) {
  const { mode } = useOrchestratorShell();
  const { showStoryOverlay, narrativeKind, diegeticNarrative } = useOrchestratorNarrativeOverlay();
  const panelStackOpen = useGamePanelStackOpen();
  const cinematicInterstitialActive = useCinematicInterstitialActive();
  const dialogueFocusActive =
    diegeticNarrative != null
    || (showStoryOverlay && (narrativeKind === 'dialogue' || narrativeKind === 'story'))
    || mode === 'cutscene'
    || cinematicInterstitialActive;

  return (
    <div
      className={`fixed inset-0 bg-black overflow-hidden${
        dialogueFocusActive ? ' dialogue-focus-active' : ''
      }${panelStackOpen ? ' panel-focus-active' : ''}`}
      style={{ touchAction: 'none' }}
    >
      {children}
    </div>
  );
}
