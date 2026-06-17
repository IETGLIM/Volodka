import type { ReactNode } from 'react';
import { useGamePanelStackOpen } from '@/components/a11y/usePanelFocusTrapActive';
import { useOrchestratorNarrativeOverlay } from '@/store/selectors';

/** Applies dialogue-focus CSS only when narrative overlay state changes. */
export function OrchestratorDialogueFocusRoot({ children }: { children: ReactNode }) {
  const { showStoryOverlay, narrativeKind } = useOrchestratorNarrativeOverlay();
  const panelStackOpen = useGamePanelStackOpen();
  const dialogueFocusActive =
    showStoryOverlay && (narrativeKind === 'dialogue' || narrativeKind === 'story');

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
