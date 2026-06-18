import { eventBus } from '@/engine/EventBus';
import { audioEngine } from '@/engine/AudioEngine';
import { getGameSnapshot } from '@/engine/GameActionDispatcher';
import { deferCombatStartIfTransitionBusy } from '@/engine/core/combatStartGate';
import { setCinematicHoldActive } from '@/engine/camera/cinematicPresentation';
import {
  pauseGltfPreloadForEncounter,
  setGltfPreloadPaused,
} from '@/engine/assets/gltfPreloadScheduler';
import { warmCombatUiModule } from '@/engine/combat/warmCombatUi';
import type { EncounterContext } from './encounterTypes';

export const ENCOUNTER_PRESENTATION_MS = 820;

let presentationActive = false;
let presentationTimer: ReturnType<typeof setTimeout> | null = null;
type CombatCommitHandler = (ctx: EncounterContext) => void;

let commitHandler: CombatCommitHandler | null = null;
const presentationListeners = new Set<() => void>();

function notifyPresentationListeners(): void {
  presentationListeners.forEach((listener) => listener());
}

export function subscribeEncounterPresentation(listener: () => void): () => void {
  presentationListeners.add(listener);
  return () => {
    presentationListeners.delete(listener);
  };
}

export function registerEncounterCommitHandler(handler: CombatCommitHandler): void {
  commitHandler = handler;
}

export function isEncounterPresentationActive(): boolean {
  return presentationActive;
}

export function cancelEncounterPresentation(): void {
  if (presentationTimer !== null) {
    clearTimeout(presentationTimer);
    presentationTimer = null;
  }
  if (presentationActive) {
    presentationActive = false;
    setCinematicHoldActive(false);
    setGltfPreloadPaused(false);
    notifyPresentationListeners();
  }
}

/** AAA encounter beat — stinger, freeze, camera pull-back — then commit combat. */
export function startEncounter(ctx: EncounterContext): boolean {
  if (presentationActive || getGameSnapshot().mode === 'combat') {
    return false;
  }

  if (
    deferCombatStartIfTransitionBusy(ctx.enemyType, {
      encounterName: ctx.encounterName,
      encounterSource: ctx.source,
      creepId: ctx.creepId,
    })
  ) {
    return true;
  }

  presentationActive = true;
  setCinematicHoldActive(true);
  pauseGltfPreloadForEncounter();
  warmCombatUiModule();
  notifyPresentationListeners();

  eventBus.emit('encounter:presentation_start', {
    ...ctx,
    sceneId: getGameSnapshot().exploration.currentSceneId,
  });

  audioEngine.playSfx('combat_engage');
  audioEngine.playStinger('mystery');
  eventBus.emit('fx:glitch', { intensity: 0.55, duration: 480 });
  eventBus.emit('fx:flash', { color: 'rgba(255,40,60,0.28)', opacity: 0.28, duration: 360 });
  eventBus.emit('camera:combat_impact', { intensity: 0.62 });

  presentationTimer = setTimeout(() => {
    presentationTimer = null;
    presentationActive = false;
    setCinematicHoldActive(false);
    notifyPresentationListeners();
    eventBus.emit('encounter:presentation_end', ctx);
    // One frame between beat teardown and combat commit — avoids rAF pile-up with UI mount.
    requestAnimationFrame(() => {
      commitHandler?.(ctx);
    });
  }, ENCOUNTER_PRESENTATION_MS);

  return true;
}
