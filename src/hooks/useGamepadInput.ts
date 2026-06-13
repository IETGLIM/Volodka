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
import type { VirtualControls } from '@/hooks/useGamePhysics';
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

function shouldBlockMovement(mode: string, panelStackLength: number): boolean {
  const { showStoryOverlay, currentNodeId } = useGameStore.getState();
  if (mode !== 'exploration' && mode !== 'combat') return true;
  if (isNarrativeMovementLocked(showStoryOverlay, currentNodeId)) return true;
  if (getInteractionState() === InteractionState.Dialogue) return true;
  if (panelStackLength > 0) return true;
  return false;
}

function shouldBlockOrbit(mode: string): boolean {
  const { showStoryOverlay, currentNodeId } = useGameStore.getState();
  if (isNarrativeMovementLocked(showStoryOverlay, currentNodeId) || mode === 'cutscene') return true;
  return getInteractionState() === InteractionState.Dialogue;
}

function shouldBlockZoom(mode: string): boolean {
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
      const { mode } = useGameStore.getState();
      const panelCount = panelStackLengthRef.current;
      const blockMove = shouldBlockMovement(mode, panelCount);
      const blockOrbit = shouldBlockOrbit(mode);
      const blockZoom = shouldBlockZoom(mode);

      if (frame.connected) {
        if (!blockMove) {
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
          const vc = virtualControlsRef.current;
          vc.forward = 0;
          vc.backward = 0;
          vc.left = 0;
          vc.right = 0;
          vc.moveMagnitude = 0;
          vc.run = 0;
          vc.jump = 0;
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
          const vc = virtualControlsRef.current;
          vc.forward = 0;
          vc.backward = 0;
          vc.left = 0;
          vc.right = 0;
          vc.moveMagnitude = 0;
          vc.run = 0;
          vc.jump = 0;
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
