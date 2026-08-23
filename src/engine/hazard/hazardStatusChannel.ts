/* ─── Volodka RPG – канал активной hazard-зоны (3D-система → HUD) ───
 *
 * Лёгкий pub/sub модульного уровня: EnvironmentalHazardSystem пишет сюда
 * состояние активной зоны каждый раз, когда игрок входит/выходит/получает
 * тик, а HUD-индикатор (HazardStatusIndicator) читает его по подписке.
 *
 * Почему не eventBus: типизированный EventMap расширяется отдельным слоем
 * (events/*), а это внутренний канал одной подсистемы — паттерн «прямого
 * subscribe» (как playerStamina, который HUD опрашивает напрямую).
 *
 * Согласованность по времени: lastTickAt пишется через performance.now(),
 * HUD по нему строит тикающий таймер урона без ре-рендеров.
 */

import type { HazardKind } from '@/data/environmentalHazards';

export interface HazardStatusSnapshot {
  readonly hazardId: string;
  readonly kind: HazardKind;
  /** Русская подпись зоны («Электричество», «Огонь», …). */
  readonly label: string;
  /** Стресс, применяемый за тик (уже капнутый и округлённый). */
  readonly stressPerTick: number;
  /** Интервал тиков в секундах. */
  readonly tickInterval: number;
  /** performance.now() момента последнего применённого тика. */
  readonly lastTickAt: number;
}

type HazardStatusListener = () => void;

/** Внутреннее состояние: все поля мутируемы (тик не плодит новых объектов/ререндеров). */
interface MutableHazardStatus {
  hazardId: string;
  kind: HazardKind;
  label: string;
  stressPerTick: number;
  tickInterval: number;
  lastTickAt: number;
}

let active: MutableHazardStatus | null = null;
const listeners = new Set<HazardStatusListener>();

function nowMs(): number {
  return typeof performance !== 'undefined' ? performance.now() : Date.now();
}

function notify(): void {
  for (const listener of listeners) listener();
}

/** Текущий статус активной зоны (null — игрок вне зоны). Ссылка стабильна до смены зоны. */
export function getHazardStatus(): HazardStatusSnapshot | null {
  return active;
}

/**
 * Игрок вошёл в зону (или зона сменилась). Уведомляет подписчиков —
 * HUD-индикатор перерисовывается только на вход/выход.
 */
export function setHazardStatus(status: Omit<HazardStatusSnapshot, 'lastTickAt'>): void {
  if (active && active.hazardId === status.hazardId) {
    // Та же зона — обновляем поля на месте, без уведомления.
    active.kind = status.kind;
    active.label = status.label;
    active.stressPerTick = status.stressPerTick;
    active.tickInterval = status.tickInterval;
    return;
  }
  active = { ...status, lastTickAt: nowMs() };
  notify();
}

/**
 * Применён очередной тик урона: обновляем только временную метку, БЕЗ
 * уведомления — тикающий таймер HUD опрашивает её своим интервалом.
 */
export function markHazardTick(): void {
  if (!active) return;
  active.lastTickAt = nowMs();
}

/** Игрок покинул зону (или сцена/фаза сменились). Уведомляет подписчиков. */
export function clearHazardStatus(): void {
  if (!active) return;
  active = null;
  notify();
}

/** Подписка на вход/выход из зоны. Возвращает функцию отписки. */
export function subscribeToHazardStatus(listener: HazardStatusListener): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

/** Сброс канала в исходное состояние (тесты). */
export function resetHazardStatusForTests(): void {
  active = null;
  notify();
}
