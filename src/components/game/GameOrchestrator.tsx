/* ─── Volodka RPG – Main game orchestrator (thin coordinator) ─── */

import { VirtualControlsContext, sharedVirtualControlsRef } from '@/engine/VirtualControlsState';
import { CyberpunkThemeProvider } from './CyberpunkTheme';
import { PanelStackProvider } from './orchestrator/PanelStackContext';
import { useOrchestratorRuntime } from './orchestrator/useOrchestratorRuntime';
import { OrchestratorCanvasLayer } from './orchestrator/OrchestratorCanvasLayer';
import { OrchestratorGameplayLayer } from './orchestrator/OrchestratorGameplayLayer';
import { OrchestratorPanelLayer } from './orchestrator/OrchestratorPanelSlots';
import { OrchestratorPauseMenu } from './orchestrator/OrchestratorPauseMenu';
import { OrchestratorQuestOverlays } from './orchestrator/OrchestratorQuestOverlays';

export function GameOrchestrator() {
  const runtime = useOrchestratorRuntime();
  const { panels, panelClosers, hudSecondaryOpeners, pauseDialog } = runtime;

  return (
    <VirtualControlsContext.Provider value={sharedVirtualControlsRef}>
      <CyberpunkThemeProvider>
        <PanelStackProvider stack={panels.panelStack}>
          <div
            className={`fixed inset-0 bg-black overflow-hidden ${runtime.isDialogueActive || runtime.isStoryActive ? 'dialogue-focus-active' : ''}`}
            style={{ touchAction: 'none' }}
          >
            <OrchestratorCanvasLayer
              mode={runtime.mode}
              introSeen={runtime.introSeen}
              gameDataReady={runtime.gameDataReady}
              canvasMounted={runtime.canvasMounted}
              canvasReady={runtime.canvasReady}
              isTransitioning={runtime.isTransitioning}
              fadeOutMs={runtime.fadeOutMs}
              matrixQuote={runtime.matrixQuote}
              onDismissMatrixQuote={runtime.dismissMatrixQuote}
            />

            <OrchestratorGameplayLayer
              gameDataReady={runtime.gameDataReady}
              sceneBanner={runtime.sceneBanner}
              interaction={runtime.interaction}
              panels={runtime.panels}
              panelClosers={panelClosers}
              hudSecondaryOpeners={hudSecondaryOpeners}
            />

            <OrchestratorPanelLayer
              showGameplayPanels={runtime.showGameplayPanels}
              onClose={panelClosers}
              onOpenPoetryBook={panels.handleOpenPoetryBook}
              devToolsArmed={runtime.devToolsArmed}
              devPanelStartOpen={runtime.devPanelStartOpen}
            />

            <OrchestratorPauseMenu pauseDialog={pauseDialog} panels={panels} onClose={panelClosers} />

            <OrchestratorQuestOverlays {...panels} />
          </div>
        </PanelStackProvider>
      </CyberpunkThemeProvider>
    </VirtualControlsContext.Provider>
  );
}
