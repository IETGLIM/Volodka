/* ─── Volodka RPG – gamepad input loop ─── */

import { useEffect, useRef, type Dispatch, type MutableRefObject } from 'react';
import { useGameStore } from '@/store/gameStore';
import { getInteractionState } from '@/components/3d/InteractionSystemBridge';
import { InteractionState } from '@/engine/interaction/interactionMachine';
import {
  GAMEPAD,
  pollGamepad,
  consumeButtonPress,
  stickToVirtualMovement,
} from '@/engine/input/gamepad';
import { setPendingGamepadOrbit } from '@/engine/input/gamepadCamera';
import { fireInteractPress } from '@/engine/input/fireInteractPress';
import { isNarrativeMovementLocked } from '@/shared/exploreHubNodes';
import { isEncounterPresentationActive } from '@/engine/combat/encounterPresentation';
import { isGameplayOverlayLocomotionLocked } from '@/engine/player/playerLocomotionGate';
import { getGamePhase, type GamePhase } from '@/shared/gamePhase';
import type { VirtualControls } from '@/hooks/useGamePhysics';
import {
  areSharedVirtualControlsWritable,
  clearSharedVirtualControls,
} from '@/engine/VirtualControlsState';
import type { PanelType } from '@/components/game/orchestrator/types';

export interface UseGamepadInputOptions {
  virtualControlsRef: MutableRefObject<VirtualControls>;
  panelStackLength: number;
  dispatchPanel: Dispatch<PanelType>;
  closePanel: () => void;
  skipActiveCutscene: () => boolean;
}

function dispatchKey(code: string, key: string): void {
  window.dispatchEvent(
    new KeyboardEvent('keydown', { code, key, bubbles: true, cancelable: true }),
  );
}

/** uiSlice.mode is always `'exploration'` — phase must come from getGamePhase(). */
function readGamepadPhase(): GamePhase {
  const s = useGameStore.getState();
  return getGamePhase({
    mainMenuOpen: s.mainMenuOpen,
    introActive: s.introActive,
    combatActive: s.combatActive,
    activeCutsceneId: s.activeCutsceneId,
  });
}

function shouldBlockMovement(mode: GamePhase, panelStackLength: number): boolean {
  const { showStoryOverlay, currentNodeId } = useGameStore.getState();
  if (mode !== 'exploration' && mode !== 'combat') return true;
  if (isEncounterPresentationActive()) return true;
  if (isNarrativeMovementLocked(showStoryOverlay, currentNodeId)) return true;
  if (getInteractionState() === InteractionState.Dialogue) return true;
  if (panelStackLength > 0) return true;
  if (isGameplayOverlayLocomotionLocked()) return true;
  return false;
}

function shouldBlockOrbit(mode: GamePhase): boolean {
  const { showStoryOverlay, currentNodeId } = useGameStore.getState();
  if (isNarrativeMovementLocked(showStoryOverlay, currentNodeId) || mode === 'cutscene') return true;
  return getInteractionState() === InteractionState.Dialogue;
}

function shouldBlockZoom(mode: GamePhase): boolean {
  const { showStoryOverlay, currentNodeId } = useGameStore.getState();
  if (mode !== 'exploration' || isNarrativeMovementLocked(showStoryOverlay, currentNodeId)) return true;
  return getInteractionState() === InteractionState.Dialogue;
}

/** Poll Gamepad API each frame → virtual controls, camera orbit, and menu shortcuts. */
export function useGamepadInput({
  virtualControlsRef,
  panelStackLength,
  dispatchPanel,
  closePanel,
  skipActiveCutscene,
}: UseGamepadInputOptions): void {
  const panelStackLengthRef = useRef(panelStackLength);
  const skipCutsceneRef = useRef(skipActiveCutscene);
  const dispatchPanelRef = useRef(dispatchPanel);
  const closePanelRef = useRef(closePanel);
  const previousButtonsRef = useRef<Map<number, boolean[]>>(new Map());
  const wasConnectedRef = useRef(false);

  useEffect(() => {
    panelStackLengthRef.current = panelStackLength;
    skipCutsceneRef.current = skipActiveCutscene;
    dispatchPanelRef.current = dispatchPanel;
    closePanelRef.current = closePanel;
  });

  useEffect(() => {
    let rafId = 0;

    const tick = () => {
      const frame = pollGamepad();
      const mode = readGamepadPhase();
      const panelCount = panelStackLengthRef.current;
      const blockMove = shouldBlockMovement(mode, panelCount);
      const blockOrbit = shouldBlockOrbit(mode);
      const blockZoom = shouldBlockZoom(mode);

      if (frame.connected) {
        if (!blockMove && areSharedVirtualControlsWritable()) {
          const move = stickToVirtualMovement(frame.leftStick);
          const vc = virtualControlsRef.current;
          vc.forward = move.forward;
          vc.backward = move.backward;
          vc.left = move.left;
          vc.right = move.right;
          vc.moveMagnitude = move.moveMagnitude;
          vc.run = frame.buttons[GAMEPAD.LB] ? 1 : 0;
          vc.jump = frame.buttons[GAMEPAD.B] ? 1 : 0;
        } else if (wasConnectedRef.current) {
          // Single clear API — same zeros as overlay-lock path (no parallel clear).
          clearSharedVirtualControls();
        }

        if (!blockOrbit && !blockZoom) {
          setPendingGamepadOrbit(frame);
        } else if (!blockOrbit) {
          setPendingGamepadOrbit({ ...frame, lt: 0, rt: 0 });
        } else {
          setPendingGamepadOrbit(null);
        }

        const padIdx = frame.index;

        if (consumeButtonPress(padIdx, GAMEPAD.A, frame.buttons[GAMEPAD.A] ?? false, previousButtonsRef)) {
          fireInteractPress('gamepad');
        }

        if (consumeButtonPress(padIdx, GAMEPAD.START, frame.buttons[GAMEPAD.START] ?? false, previousButtonsRef)) {
          if (skipCutsceneRef.current()) {
            /* cutscene handled */
          } else if (panelCount > 0) {
            closePanelRef.current();
          } else if (mode === 'exploration') {
            dispatchPanelRef.current('menu');
          } else if (mode === 'menu') {
            /* menu navigation handled by useMenuNavigation */
          } else {
            dispatchKey('Escape', 'Escape');
          }
        }

        if (consumeButtonPress(padIdx, GAMEPAD.Y, frame.buttons[GAMEPAD.Y] ?? false, previousButtonsRef)) {
          dispatchPanelRef.current('inventory');
        }

        if (consumeButtonPress(padIdx, GAMEPAD.X, frame.buttons[GAMEPAD.X] ?? false, previousButtonsRef)) {
          dispatchPanelRef.current('quests');
        }

        if (consumeButtonPress(padIdx, GAMEPAD.SELECT, frame.buttons[GAMEPAD.SELECT] ?? false, previousButtonsRef)) {
          dispatchPanelRef.current('journal');
        }

        wasConnectedRef.current = true;
      } else {
        if (wasConnectedRef.current) {
          clearSharedVirtualControls();
          previousButtonsRef.current.clear();
          wasConnectedRef.current = false;
        }
        setPendingGamepadOrbit(null);
      }

      rafId = requestAnimationFrame(tick);
    };

    rafId = requestAnimationFrame(tick);
    return () => {
      cancelAnimationFrame(rafId);
      setPendingGamepadOrbit(null);
    };
  }, [virtualControlsRef]);
}
