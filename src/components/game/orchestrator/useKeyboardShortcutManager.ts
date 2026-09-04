import { useEffect, useRef, type Dispatch } from 'react';
import { useGameStore } from '@/store/gameStore';
import { eventBus } from '@/engine/EventBus';
import { PHOTO_EVENTS, PHOTO_EMPTY_PAYLOAD } from '@/engine/events';
import { photoModeActive } from '@/engine/photo/photoModeState';
import {
  applyEscapeDismissAction,
  resolveEscapeDismissAction,
} from '@/engine/input/escapeDismissAction';
import { registerPanelShortcutHandler } from '@/engine/input/panelShortcutDispatcher';
import { quickSaveGame, quickLoadGame } from '../save/quickSaveLoad';
import type { MinigamePanelSetters } from '@/shared/constants/minigames';
import type { PanelType } from './types';
import { blocksPanelShortcuts, type GamePhase } from '@/shared/gamePhase';

/** Минимальный снапшот панельного состояния для свитчборда. */
interface PanelSwitchboardState {
  activePanel: PanelType;
  mode: GamePhase;
}

interface PanelSwitchboardIo {
  dispatchPanel: (panel: PanelType) => void;
  closeAllPanels: () => void;
}

/**
 * Свитчборд «чистых» панельных клавиш (без модификаторов).
 * Единая точка правды для window-keydown И прямого вызова из мобильного HUD
 * (panelShortcutDispatcher) — раньше мобильные кнопки дублировали поведение
 * синтетическими KeyboardEvent, и любой новый шорткат требовал правок в двух
 * местах. Модификаторные комбинации (Shift+T, Shift+S, Shift+P) обрабатываются
 * только клавиатурным путём и сюда не попадают.
 *
 * @returns true — код распознан и панель переключена.
 */
function runPanelSwitchboard(
  code: string,
  ps: PanelSwitchboardState,
  io: PanelSwitchboardIo,
): boolean {
  if (blocksPanelShortcuts(ps.mode)) return false;

  switch (code) {
    case 'KeyJ':
      if (ps.activePanel !== 'journal') io.closeAllPanels();
      io.dispatchPanel('journal');
      return true;
    case 'KeyQ':
      io.dispatchPanel('quests');
      return true;
    case 'KeyI':
      io.dispatchPanel('inventory');
      return true;
    case 'Tab':
    case 'KeyM':
      io.dispatchPanel('worldMap');
      return true;
    case 'KeyP':
      io.dispatchPanel('poetry');
      return true;
    case 'KeyN':
      io.dispatchPanel('npcRelation');
      return true;
    case 'KeyO':
      io.dispatchPanel('adventureLog');
      return true;
    case 'KeyC':
      io.dispatchPanel('characterProfile');
      return true;
    case 'KeyK':
      io.dispatchPanel('codex');
      return true;
    case 'KeyL':
      io.dispatchPanel('dialogueHistory');
      return true;
    case 'KeyH':
      io.dispatchPanel('achievements');
      return true;
    case 'KeyT':
      io.dispatchPanel('skillTree');
      return true;
    case 'KeyG':
      io.dispatchPanel('crafting');
      return true;
    case 'KeyF':
      io.dispatchPanel('fastTravel');
      return true;
    case 'KeyV':
      io.dispatchPanel('perks');
      return true;
    case 'KeyB':
      io.dispatchPanel('questBoard');
      return true;
    case 'KeyY':
      io.dispatchPanel('karmaPoem');
      return true;
    default:
      return false;
  }
}

interface MinigameOpenFlags {
  codebreakerOpen: boolean;
  openstackTerminalOpen: boolean;
  bashTerminalOpen: boolean;
  poetryGameOpen: boolean;
  hackingGameOpen: boolean;
  memoryGameOpen: boolean;
  quizGameOpen: boolean;
  rhythmGameOpen: boolean;
}

export interface KeyboardShortcutManagerOptions extends MinigameOpenFlags {
  activePanel: PanelType;
  panelStackLength: number;
  examineOpen: boolean;
  mode: GamePhase;
  dispatchPanel: Dispatch<PanelType>;
  closePanel: () => void;
  closeAllPanels: () => void;
  minigameSetters: MinigamePanelSetters;
  skipActiveCutscene: () => boolean;
  resetExamine: () => void;
  clearPendingTriggerZone: () => void;
}

/** Global keydown handler — stable listener via refs, no dependency churn. */
export function useKeyboardShortcutManager({
  activePanel,
  panelStackLength,
  codebreakerOpen,
  openstackTerminalOpen,
  bashTerminalOpen,
  poetryGameOpen,
  hackingGameOpen,
  memoryGameOpen,
  quizGameOpen,
  rhythmGameOpen,
  examineOpen,
  mode,
  dispatchPanel,
  closePanel,
  closeAllPanels,
  minigameSetters,
  skipActiveCutscene,
  resetExamine,
  clearPendingTriggerZone,
}: KeyboardShortcutManagerOptions) {
  const panelStateRef = useRef({
    activePanel,
    panelStackLength,
    codebreakerOpen,
    openstackTerminalOpen,
    bashTerminalOpen,
    poetryGameOpen,
    hackingGameOpen,
    memoryGameOpen,
    quizGameOpen,
    rhythmGameOpen,
    examineOpen,
    mode,
  });
  const minigameSettersRef = useRef(minigameSetters);
  const skipCutsceneRef = useRef(skipActiveCutscene);
  const closePanelRef = useRef(closePanel);
  const closeAllPanelsRef = useRef(closeAllPanels);
  const dispatchPanelRef = useRef(dispatchPanel);

  useEffect(() => {
    panelStateRef.current = {
      activePanel,
      panelStackLength,
      codebreakerOpen,
      openstackTerminalOpen,
      bashTerminalOpen,
      poetryGameOpen,
      hackingGameOpen,
      memoryGameOpen,
      quizGameOpen,
      rhythmGameOpen,
      examineOpen,
      mode,
    };
    minigameSettersRef.current = minigameSetters;
    skipCutsceneRef.current = skipActiveCutscene;
    closePanelRef.current = closePanel;
    closeAllPanelsRef.current = closeAllPanels;
    dispatchPanelRef.current = dispatchPanel;
  });

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable) return;

      const ps = panelStateRef.current;

      if (e.code === 'Escape') {
        if (skipCutsceneRef.current()) {
          e.preventDefault();
          e.stopImmediatePropagation();
          return;
        }

        // Photo mode is NOT part of the panel stack, so the escape-dismiss chain
        // below doesn't know about it. Without this guard, Escape falls through to
        // `toggle_pause_menu` and the player is stuck in photo mode with a pause
        // menu on top. Close photo mode first, before any other escape handling.
        if (photoModeActive.current) {
          e.preventDefault();
          e.stopImmediatePropagation();
          eventBus.emit(PHOTO_EVENTS.inactive, PHOTO_EMPTY_PAYLOAD);
          return;
        }

        const action = resolveEscapeDismissAction(ps);
        if (action.type === 'noop') return;

        e.preventDefault();
        e.stopImmediatePropagation();

        applyEscapeDismissAction(action, {
          resetExamine,
          clearPendingTriggerZone,
          minigameSetters: minigameSettersRef.current,
          minigameFlags: ps,
          closePanel: () => closePanelRef.current(),
          dispatchPanel: (panel) => dispatchPanelRef.current(panel),
        });
        return;
      }

      // Movement / look keys + Shift (run): 3D input owns these. Exit before the
      // panel switchboard so WASD/arrow/Shift bursts don't walk dozens of checks.
      // Shift+S still opens stats below.
      if (
        e.code === 'KeyW' ||
        e.code === 'KeyA' ||
        e.code === 'KeyD' ||
        e.code === 'ArrowUp' ||
        e.code === 'ArrowDown' ||
        e.code === 'ArrowLeft' ||
        e.code === 'ArrowRight' ||
        e.code === 'Space' ||
        e.code === 'ShiftLeft' ||
        e.code === 'ShiftRight' ||
        (e.code === 'KeyS' && !e.shiftKey)
      ) {
        return;
      }

      // Auto-repeat on letter keys shouldn't open panels / save.
      if (e.repeat) return;

      const panelShortcutsBlocked = blocksPanelShortcuts(ps.mode);

      if (panelShortcutsBlocked) return;

      /* Модификаторные комбинации — только клавиатура, до свитчборда. */
      if (e.code === 'KeyP' && e.shiftKey) {
        e.preventDefault();
        eventBus.emit(PHOTO_EVENTS.toggle, PHOTO_EMPTY_PAYLOAD);
        return;
      }
      if (e.shiftKey && e.code === 'KeyT') {
        e.preventDefault();
        dispatchPanel('trading');
        return;
      }

      /* Чистые панельные клавиши — общий свитчборд (клавиатура + мобильный HUD). */
      if (runPanelSwitchboard(e.code, ps, {
        dispatchPanel,
        closeAllPanels: () => closeAllPanelsRef.current(),
      })) {
        e.preventDefault();
        return;
      }

      if (e.code === 'KeyS' && e.shiftKey && !e.ctrlKey) {
        e.preventDefault();
        dispatchPanel('stats');
      }
      if (e.code === 'KeyR') {
        const store = useGameStore.getState();
        if (
          store.exploration.currentSceneId === 'volodka_room' ||
          store.exploration.currentSceneId === 'home_evening'
        ) {
          dispatchPanel('rest');
        }
      }
      if (e.code === 'F1' || (e.code === 'Slash' && e.shiftKey)) {
        e.preventDefault();
        dispatchPanel('shortcuts');
      }
      if (e.code === 'Slash' && !e.shiftKey) {
        e.preventDefault();
        dispatchPanel('shortcuts');
      }
      // Quick save — F5. Тяжёлая сериализация — вне критического пути keydown;
      // честный тост по исходу (v4.8.6: раньше «Игра сохранена» показывалась
      // даже когда saveGame молча пропускал запись).
      if (e.code === 'F5') {
        e.preventDefault();
        queueMicrotask(() => {
          quickSaveGame();
        });
      }
      // Quick load — F9. В бою/кат-сцене/диалоге — предупреждение вместо
      // опасного патча сейва под живым runtime'ом.
      if (e.code === 'F9') {
        e.preventDefault();
        queueMicrotask(() => {
          quickLoadGame();
        });
      }
    };

    window.addEventListener('keydown', handleKey, true);
    return () => window.removeEventListener('keydown', handleKey, true);
  }, [
    dispatchPanel,
    closePanel,
    closeAllPanels,
    resetExamine,
    clearPendingTriggerZone,
  ]);

  /* ── Прямой канал для мобильного HUD / геймпада ──
   * Регистрируем свитчборд в panelShortcutDispatcher один раз на монтирование:
   * все ref'ы стабильны, актуальное состояние читается внутри вызова.
   * До этого MobileActionButtons эмулировал KeyI/KeyJ синтетическими
   * KeyboardEvent — событие проходило по всем window-подписчикам, и поведение
   * зависело от порядка листенеров. */
  useEffect(() => {
    return registerPanelShortcutHandler((code) =>
      runPanelSwitchboard(code, panelStateRef.current, {
        dispatchPanel: (panel) => dispatchPanelRef.current(panel),
        closeAllPanels: () => closeAllPanelsRef.current(),
      }),
    );
  }, []);
}
