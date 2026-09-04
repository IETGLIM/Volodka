/* ─── Volodka RPG – быстрое сохранение/загрузка с честной обратной связью ───
 *
 * Единая точка быстрого сохранения/загрузки для всех входов: F5/F9,
 * меню паузы («Быстрое сохранение», «Загрузить») и мобильного HUD.
 *
 * Проблема, которую решает модуль (v4.8.6):
 *   • F5 показывал «Игра сохранена» даже когда saveGame молча пропускал
 *     запись (кат-сцена / бой / диалог) — игрок уходил с ложной уверенностью.
 *   • «Загрузить» из меню паузы и F9 работали молча: ни подтверждения, ни
 *     объяснения, почему ничего не произошло (пустое хранилище), а загрузка
 *     В БОЮ вообще была возможна — патч сейва сбрасывал runtime движка под
 *     живым CombatSystem'ом (латентный баг: combat runtime не персистится).
 *
 * Решение: saveGame/loadGame возвращают типизированный исход
 * (SaveGameOutcome/LoadGameOutcome), а этот модуль переводит его в честный
 * русский тост. Ошибки записи/чтения НЕ дублируются тостом — слайс уже
 * отправляет game:system_alert в ленту уведомлений.
 *
 * Расположение: components/game/save — модуль стоит НАД слайсами (вызывает
 * действия стора и рисует тосты), поэтому не может жить в engine/ или
 * shared/ (границы импортов eslint). Все три вызывающих — компоненты.
 * Тяжёлая работа (сериализация / патч состояния) выполняется синхронно в
 * вызывающем тике — клавиатурный путь по-прежнему размазан через
 * queueMicrotask в самом обработчике F5/F9.
 */

import { useGameStore } from '@/store/gameStore';
import { isInteractionLockedFromStore } from '@/store/storeEngineHost';
import type { SaveGameOutcome, LoadGameOutcome } from '@/store/slices/saveSlice';
import { getGamePhase, type GamePhaseState } from '@/shared/gamePhase';

/* ─── Тосты: динамический импорт, чтобы sonner не попадал в engine-чанк ── */

function toastSuccess(title: string, description: string): void {
  void import('sonner').then(({ toast }) => {
    toast.success(title, { description, duration: 2500 });
  });
}

function toastWarning(title: string, description: string): void {
  void import('sonner').then(({ toast }) => {
    toast.warning(title, { description, duration: 3000 });
  });
}

function toastInfo(title: string, description: string): void {
  void import('sonner').then(({ toast }) => {
    toast.info(title, { description, duration: 3000 });
  });
}

/* ─── Сохранение ─── */

function reportSaveOutcome(outcome: SaveGameOutcome): void {
  switch (outcome.status) {
    case 'saved':
      toastSuccess('Игра сохранена', 'Прогресс записан.');
      break;
    case 'skipped':
      switch (outcome.reason) {
        case 'cutscene':
          toastWarning('Сейчас нельзя сохранить', 'Дождитесь конца сцены.');
          break;
        case 'combat':
          toastWarning('Сохранение недоступно в бою', 'Завершите бой — прогресс запишется автоматически.');
          break;
        case 'interaction':
          toastWarning('Сохранение недоступно', 'Сначала завершите разговор или взаимодействие.');
          break;
      }
      break;
    case 'failed':
      // Слайс уже отправил game:system_alert в ленту уведомлений —
      // дублировать тостом не нужно.
      break;
  }
}

/**
 * Быстрое сохранение (F5 / меню паузы / мобильный HUD).
 * Возвращает исход — удобно для тестов и будущих вызывающих.
 */
export function quickSaveGame(): SaveGameOutcome | null {
  let outcome: SaveGameOutcome;
  try {
    outcome = useGameStore.getState().saveGame({ source: 'manual' });
  } catch {
    // Store ещё не готов (ранний бут) — молча игнорируем, как раньше.
    return null;
  }
  reportSaveOutcome(outcome);
  return outcome;
}

/* ─── Загрузка ─── */

/**
 * Фазы, в которых загрузка сейва запрещена: патч сейва сбрасывает runtime
 * движка (resetEngineRuntimeFromStore), а боевой runtime не персистится —
 * загрузка под живым боем/кат-сценой/диалогом ломала бы состояние.
 * Меню и интро до сюда не доходят (клавиатурный путь отфильтрован
 * blocksPanelShortcuts, мобильные кнопки видны только в exploration).
 */
function isLoadBlockedNow(): boolean {
  try {
    const s = useGameStore.getState();
    const phaseState: GamePhaseState = {
      mainMenuOpen: s.mainMenuOpen,
      introActive: s.introActive,
      combatActive: s.combatActive,
      activeCutsceneId: s.activeCutsceneId,
    };
    const phase = getGamePhase(phaseState);
    return phase === 'combat' || phase === 'cutscene' || isInteractionLockedFromStore();
  } catch {
    return false;
  }
}

function reportLoadOutcome(outcome: LoadGameOutcome): void {
  switch (outcome.status) {
    case 'loaded':
      // Восстановление из резервной копии уже озвучено system-алертом слайса.
      if (!outcome.recoveredFromBackup) {
        toastSuccess('Игра загружена', 'Последнее сохранение восстановлено.');
      }
      break;
    case 'empty':
      toastInfo('Сохранений пока нет', 'Сохраните игру через F5 или меню паузы.');
      break;
    case 'failed':
      // Слайс уже отправил game:system_alert — без дубля.
      break;
  }
}

/**
 * Быстрая загрузка (F9 / меню паузы / мобильный HUD).
 * В бою/кат-сцене/диалоге показывает предупреждение вместо опасного патча.
 */
export function quickLoadGame(): LoadGameOutcome | 'blocked' | null {
  if (isLoadBlockedNow()) {
    toastWarning('Сейчас нельзя загружать', 'Загрузка доступна вне боя, сцен и разговоров.');
    return 'blocked';
  }
  let outcome: LoadGameOutcome;
  try {
    outcome = useGameStore.getState().loadGame();
  } catch {
    return null;
  }
  reportLoadOutcome(outcome);
  return outcome;
}
