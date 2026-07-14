import { ErrorBoundary } from '@/components/ErrorBoundary';
import { VirtualControlsContext, sharedVirtualControlsRef } from '@/engine/VirtualControlsState';
import { CyberpunkThemeProvider } from '../CyberpunkTheme';
import { PanelStackProvider } from './PanelStackContext';
import { OrchestratorDialogueFocusRoot } from './OrchestratorDialogueFocusRoot';
import { OrchestratorCanvasLayer } from './OrchestratorCanvasLayer';
import { OrchestratorGameplayLayer } from './OrchestratorGameplayLayer';
import { OrchestratorPanelLayer } from './OrchestratorPanelSlots';
import { OrchestratorPauseMenu } from './OrchestratorPauseMenu';
import { OrchestratorQuestOverlays } from './OrchestratorQuestOverlays';
import { useOrchestratorComposition } from './useOrchestratorComposition';
import { GameAnnouncer } from '@/components/a11y/GameAnnouncer';

/** Renders orchestrator layers from memoized prop bundles. */
export function OrchestratorContent() {
  const { canvasProps, gameplayProps, panelProps, pauseProps, questProps, panelStack } =
    useOrchestratorComposition();

  return (
    // Shared ref is intentional: R3F useFrame reads controls without React re-renders.
    <VirtualControlsContext.Provider value={sharedVirtualControlsRef}>
      <CyberpunkThemeProvider>
        <PanelStackProvider stack={panelStack}>
          <OrchestratorDialogueFocusRoot>
            <ErrorBoundary name="canvas">
              <OrchestratorCanvasLayer {...canvasProps} />
            </ErrorBoundary>

            <ErrorBoundary name="gameplay">
              <OrchestratorGameplayLayer {...gameplayProps} />
            </ErrorBoundary>

            <ErrorBoundary name="panels">
              <OrchestratorPanelLayer {...panelProps} />
            </ErrorBoundary>

            <ErrorBoundary name="pause">
              <OrchestratorPauseMenu {...pauseProps} />
            </ErrorBoundary>

            <ErrorBoundary name="quests">
              <OrchestratorQuestOverlays {...questProps} />
            </ErrorBoundary>

            {/* Screen reader announcements for game events */}
            <GameAnnouncer />
          </OrchestratorDialogueFocusRoot>
        </PanelStackProvider>
      </CyberpunkThemeProvider>
    </VirtualControlsContext.Provider>
  );
}
