import type { ReactNode } from 'react';
import { useOrchestratorNarrativeOverlay } from '@/store/selectors';

/** Applies dialogue-focus CSS only when narrative overlay state changes. */
export function OrchestratorDialogueFocusRoot({ children }: { children: ReactNode }) {
  const { showStoryOverlay, narrativeKind } = useOrchestratorNarrativeOverlay();
  const dialogueFocusActive =
    showStoryOverlay && (narrativeKind === 'dialogue' || narrativeKind === 'story');

  return (
    <div
      className={`fixed inset-0 bg-black overflow-hidden${dialogueFocusActive ? ' dialogue-focus-active' : ''}`}
      style={{ touchAction: 'none' }}
    >
      {children}
    </div>
  );
}
