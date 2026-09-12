/**
 * Событийные QTE-триггеры (v4.31) — контентный слой подсистемы QTE.
 *
 * Подсистема QTE (домен qte:* + QuickTimeEventHost) до этой волны была
 * dormant: qte:start эмитили только тесты. Здесь живут два сценарных
 * источника событий:
 *
 *  1. Хак-гейт (`linkedQte` на TriggerZone): перед открытием миниигры
 *     взлома игроку предлагается «стабилизировать канал» — успешный QTE
 *     даёт бонус XP, провал не блокирует взлом (graceful degradation —
 *     терминал открывается с помехами, без soft-lock квестовых зон).
 *  2. Финишер-усилитель (`combat:creep_finished`): после реал-тайм
 *     добивания ослабленного крипа — бонусный QTE «фиксация протокола»
 *     с кулдауном и шансом, успех даёт небольшой бонус XP.
 *
 * Оркестрация хак-гейта двухфазная (v4.31):
 *   - `qte:resolve` — награды/помехи по исходу;
 *   - `qte:closed`  — экран свободен → открываем миниигру (без наложения
 *     терминала на экран результата хоста; cancelled — терминал сразу).
 *
 * Все запуски проходят двойной гейт занятости экрана
 * (isGameplayOverlayLocomotionLocked — тот же предикат, что у хоста),
 * поэтому триггеры не конкурируют с диалогами/минииграми/кат-сценами:
 * если экран занят — QTE молча пропускается (хак-гейт сразу открывает
 * миниигру), повторных всплесков нет. Проверка синхронна с проверкой
 * хоста (один тик EventBus), поэтому хост не отбрасывает наши start'ы:
 * активный QTE/экран результата держат локомоция-гейт → гейт-предикат
 * уже true → мы бы даже не эмитили.
 */

import { eventBus } from '@/engine/EventBus';
import { dispatchGameAction } from '@/engine/GameActionDispatcher';
import { isGameplayOverlayLocomotionLocked } from '@/engine/player/playerLocomotionGate';
import type { TriggerZone } from '@/data/triggerZones';
import type { QteStartPayload } from '@/engine/events/qteEvents';
import type { QTEFinalResult, QTEKeyBinding } from '@/engine/qte/qteTypes';

/** Клавиша хак-гейта: та же E, что и взаимодействие (во время QTE ввод мира заморожен). */
const GATE_KEY: QTEKeyBinding = { display: 'E', code: 'KeyE' };

/** Клавиша финишер-усилителя: пробел (прыжок заморожен локомоция-гейтом QTE). */
const FINISHER_KEY: QTEKeyBinding = { display: 'Пробел', code: 'Space' };

/** Кулдаун финишер-усилителя, мс — не чаще одного QTE на несколько боёв. */
const FINISHER_COOLDOWN_MS = 25_000;

/** Шанс запуска финишер-усилителя (детерминизм не требуется — боевой RNG). */
const FINISHER_CHANCE = 0.65;

/** Бонус XP за стабилизацию канала перед взломом. */
const GATE_SUCCESS_XP = 2;

/** Бонус XP за фиксацию протокола после добивания. */
const FINISHER_SUCCESS_XP = 3;

/**
 * Контекст нашей сессии QTE — восстанавливается по id на qte:resolve/closed.
 * Дискриминированное объединение: у hack_gate игра-получатель обязательна
 * (без неё открытие терминала невозможно по построению).
 */
type QteTriggerContext =
  | { kind: 'hack_gate'; gameType: NonNullable<TriggerZone['linkedMinigame']>; zoneId: string }
  | { kind: 'finisher'; enemyName?: string };

/** Активные контексты по id сессии (чистятся на resolve/closed, cap от утечки). */
const pendingContexts = new Map<string, QteTriggerContext>();

/** Контекстов не больше, чем может накопиться между resolve-ами. */
const PENDING_CONTEXT_CAP = 16;

/** Вытеснить самый старый контекст при переполнении (FIFO-защита от утечки). */
function evictOldestContext(): void {
  if (pendingContexts.size < PENDING_CONTEXT_CAP) return;
  const oldest = pendingContexts.keys().next().value;
  if (oldest !== undefined) pendingContexts.delete(oldest);
}

let sessionCounter = 0;
/** Инициализация в «прошлом»: первое в сессии добивание должно всегда
 *  иметь шанс сработать (performance.now() отсчитывается от старта
 *  страницы — при инициализации нулём первый финишер первых 25 секунд
 *  игры молча блокировался бы кулдауном). */
let lastFinisherAt = -FINISHER_COOLDOWN_MS;
let detachListeners: (() => void) | null = null;

function nextSessionId(prefix: string): string {
  sessionCounter += 1;
  return `qte_${prefix}_${sessionCounter}`;
}

function pushNotification(type: 'skill' | 'stress' | 'karma', text: string): void {
  dispatchGameAction({ type: 'notification/push', notificationType: type, text });
}

/**
 * Хак-гейт: QTE «стабилизация канала» перед открытием миниигры зоны.
 * Экран занят (диалог/миниигра/другой QTE) → миниигра открывается сразу,
 * без QTE — триггер никогда не становится блокером прогресса.
 */
export function startQteMinigameGate(zone: TriggerZone): void {
  const spec = zone.linkedQte;
  const gameType = zone.linkedMinigame;

  // Защитные фолбэки: поле декларативное — некорректные данные не должны
  // ломать интеракцию (открываем миниигру напрямую).
  if (!gameType) return;
  if (!spec || isGameplayOverlayLocomotionLocked()) {
    eventBus.emit('minigame:open', { gameType });
    return;
  }

  const id = nextSessionId('gate');
  evictOldestContext();
  pendingContexts.set(id, { kind: 'hack_gate', gameType, zoneId: zone.id });

  const payload: QteStartPayload = {
    id,
    eventType: spec.eventType,
    keyBindings: [GATE_KEY],
    duration: spec.duration,
    difficulty: spec.difficulty,
    context: { kind: 'hack_gate', zoneId: zone.id, gameType },
  };
  eventBus.emit('qte:start', payload);
}

/** Финишер-усилитель: реакция на реал-тайм добивание крипа. */
function handleCreepFinished(payload: { enemyName: string }): void {
  const now = performance.now();
  if (now - lastFinisherAt < FINISHER_COOLDOWN_MS) return;
  if (Math.random() > FINISHER_CHANCE) return;
  // Экран занят (диалог/кат-сцена/миниигра/другой QTE) — пропуск, без очереди.
  if (isGameplayOverlayLocomotionLocked()) return;

  lastFinisherAt = now;
  const id = nextSessionId('fin');
  evictOldestContext();
  pendingContexts.set(id, { kind: 'finisher', enemyName: payload.enemyName });

  eventBus.emit('qte:start', {
    id,
    eventType: 'press',
    keyBindings: [FINISHER_KEY],
    duration: 2400,
    difficulty: 'normal',
    context: { kind: 'finisher', enemyName: payload.enemyName },
  });
}

/** Фаза 1 хак-гейта: награды/помехи по исходу (миниигру откроет qte:closed). */
function applyGateOutcome(context: QteTriggerContext, result: QTEFinalResult): void {
  if (context.kind !== 'hack_gate' || result === 'cancelled') return;
  if (result === 'success') {
    dispatchGameAction({ type: 'player/addXp', amount: GATE_SUCCESS_XP });
    pushNotification('skill', 'Канал стабилизирован — взлом начисто (+' + GATE_SUCCESS_XP + ' XP)');
  } else {
    eventBus.emit('fx:glitch', { duration: 350, intensity: 0.6 });
    pushNotification('stress', 'Помехи не устранены — взлом идёт через шум');
  }
}

/** Фаза 2 хак-гейта: экран свободен — открываем миниигру зоны. */
function openGateMinigame(context: QteTriggerContext): void {
  if (context.kind !== 'hack_gate') return;
  eventBus.emit('minigame:open', { gameType: context.gameType });
}

/** Итог сессии: награды хак-гейта, бонус финишера (по одному разу на id). */
function handleQteResolve({ id, result }: { id: string; result: QTEFinalResult }): void {
  const context = pendingContexts.get(id);
  if (!context) return;

  if (context.kind === 'hack_gate') {
    // Любой исход открывает миниигру (graceful degradation) — на qte:closed.
    // cancelled: игрок скипнул QTE (Escape) — без наград и без помех.
    applyGateOutcome(context, result);
    return;
  }

  pendingContexts.delete(id);
  // finisher: добивание уже свершилось — QTE лишь бонусный ритуал.
  if (result === 'success') {
    dispatchGameAction({ type: 'player/addXp', amount: FINISHER_SUCCESS_XP });
    pushNotification(
      'karma',
      'Протокол зафиксирован: ' + (context.enemyName ?? 'цель') + ' — +' + FINISHER_SUCCESS_XP + ' XP',
    );
  } else if (result === 'failure' || result === 'timeout') {
    pushNotification('stress', 'Протокол рассыпался — след потерян');
  }
}

/** Оверлей ушёл с экрана: hack-гейт открывает миниигру, контексты чистятся. */
function handleQteClosed({ id }: { id: string }): void {
  const context = pendingContexts.get(id);
  if (!context) return;
  pendingContexts.delete(id);
  openGateMinigame(context);
}

/** Кэш контекстов: заполняется при qte:start (наши эмиттеры), чистится на closed. */
function cacheStartContext(payload: QteStartPayload): void {
  const kind = payload.context?.['kind'];
  if (kind !== 'hack_gate' && kind !== 'finisher') return;
  if (pendingContexts.has(payload.id)) return;
  if (kind === 'hack_gate') {
    const gameType = payload.context?.['gameType'] as TriggerZone['linkedMinigame'] | undefined;
    if (!gameType) return;
    pendingContexts.set(payload.id, {
      kind,
      gameType,
      zoneId: (payload.context?.['zoneId'] as string | undefined) ?? '',
    });
    return;
  }
  pendingContexts.set(payload.id, {
    kind: 'finisher',
    enemyName: payload.context?.['enemyName'] as string | undefined,
  });
}

/**
 * Навесить слушатели триггеров (вызывается маунтом QuickTimeEventTriggers).
 * Повторный вызов — no-op (идемпотентно).
 */
export function attachQteTriggerListeners(): void {
  if (detachListeners) return;
  const offs = [
    eventBus.on('qte:start', cacheStartContext),
    eventBus.on('qte:resolve', handleQteResolve),
    eventBus.on('qte:closed', handleQteClosed),
    eventBus.on('combat:creep_finished', handleCreepFinished),
  ];
  detachListeners = () => {
    for (const off of offs) off();
  };
}

/** Снять слушатели и сбросить состояние (анмаунт/тесты). */
export function detachQteTriggerListeners(): void {
  detachListeners?.();
  detachListeners = null;
  pendingContexts.clear();
  lastFinisherAt = -FINISHER_COOLDOWN_MS;
}

/** Тестовый доступ: сброс счётчиков без снятия слушателей. */
export function resetQteTriggersForTests(): void {
  pendingContexts.clear();
  sessionCounter = 0;
  lastFinisherAt = -FINISHER_COOLDOWN_MS;
}
