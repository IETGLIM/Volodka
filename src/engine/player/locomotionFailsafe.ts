/**
 * Locomotion failsafe watchdog (v4.46).
 *
 * Репорт игрока: «при выходе в коридор … движение перестаёт работать».
 * Причина — рассинхрон модульных гейтов локомоции с реальным состоянием UI:
 * panel/minigame/QTE-гейты ставятся React-эффектами, а снимаются не всегда
 * (размонтирование во время перехода сцены, гонка StrictMode, exception в
 * эффекте закрытия). Аналогично module-level cinematicHold и FSM взаимодействия
 * могут залипнуть в активном состоянии, когда все стор-флаги уже чистые.
 *
 * Watchdog раз в 600мс проверяет «чистое исследование»: фаза exploration,
 * нет оверлеев/кат-сцен/таймлайнов/FPS-локов. Если при этом движение всё ещё
 * заблокировано модульными гейтами — 3 тика подряд (≥1.8с) — принудительно
 * снимает залипшие гейты. Игрок в худшем случае теряет ~2 секунды, вместо
 * перманентно мёртвого WASD.
 */

import { getGameStore } from '@/store/gameStore';
import { readGamePhase } from '@/shared/gamePhase';
import { devWarn } from '@/shared/utils/devLog';
import {
  isCinematicHoldActive,
  setCinematicHoldActive,
} from '@/engine/camera/cinematicPresentation';
import { isCinematicTimelineActive } from '@/engine/cinematic/cinematicTimelineOrchestrator';
import {
  isGameplayOverlayLocomotionLocked,
  setPanelStackLocomotionGate,
  setMinigameLocomotionGate,
  setQteLocomotionGate,
} from '@/engine/player/playerLocomotionGate';
import { isExamineOverlayOpen } from '@/engine/assets/gltfPreloadOverlayGate';
import { isEncounterPresentationActive } from '@/engine/combat/encounterPresentation';
import {
  isInteractionLocked,
  resetInteractionSession,
} from '@/engine/interaction/interactionSession';
import { resetKeyboardInputState } from '@/engine/keyboardInputState';
import { setSharedVirtualControlsWritable } from '@/engine/VirtualControlsState';

/** Порог «залипания» в тиках до принудительного освобождения (3 × 600мс). */
const STUCK_STRIKE_LIMIT = 3;

let watchdogTimer: ReturnType<typeof setInterval> | null = null;
let strikes = 0;

/** Все источники блокировки, не живущие в сторе, чисты? */
function isInteractionPipelineIdle(): boolean {
  return (
    !isInteractionLocked() &&
    !isCinematicHoldActive() &&
    !isGameplayOverlayLocomotionLocked()
  );
}

function forceReleaseStuckGates(): void {
  devWarn(
    '[locomotionFailsafe] Movement stuck in pure exploration for >1.8s — ' +
      'force-releasing module gates (panel/minigame/qte/cinematic-hold/interaction FSM).',
  );
  setPanelStackLocomotionGate(false);
  setMinigameLocomotionGate(false);
  setQteLocomotionGate(false);
  setCinematicHoldActive(false);
  resetInteractionSession();
  resetKeyboardInputState();
  setSharedVirtualControlsWritable(true);
}

function tick(): void {
  let store: ReturnType<typeof getGameStore>;
  try {
    store = getGameStore();
  } catch {
    return; // store не готов (HMR/teardown) — пропускаем тик
  }

  const phase = readGamePhase(store);

  // «Чистое исследование»: фаза exploration, ни одного стор-источника лока.
  const pureExploration =
    phase === 'exploration' &&
    !store.showStoryOverlay &&
    !store.diegeticNarrative &&
    !store.activeCutsceneId;

  if (!pureExploration) {
    strikes = 0;
    return;
  }

  // Дополнительные внешние владельцы экрана, при которых «залипание»
  // может быть легитимным — не трогаем.
  if (
    isCinematicTimelineActive() ||
    isExamineOverlayOpen() ||
    isEncounterPresentationActive()
  ) {
    strikes = 0;
    return;
  }

  if (isInteractionPipelineIdle()) {
    strikes = 0;
    return;
  }

  strikes += 1;
  if (strikes >= STUCK_STRIKE_LIMIT) {
    strikes = 0;
    forceReleaseStuckGates();
  }
}

/** Запуск watchdog'а (идемпотентно). Вызывается из orchestrator lifecycle. */
export function startLocomotionFailsafeWatchdog(): void {
  if (watchdogTimer !== null) return;
  strikes = 0;
  watchdogTimer = setInterval(tick, 600);
}

/** Остановка (unmount / HMR dispose). */
export function stopLocomotionFailsafeWatchdog(): void {
  if (watchdogTimer !== null) {
    clearInterval(watchdogTimer);
    watchdogTimer = null;
  }
  strikes = 0;
}

/** Сброс для тестов. */
export function resetLocomotionFailsafeForTests(): void {
  stopLocomotionFailsafeWatchdog();
}
