import type { QTEDifficulty, QTEEventType, QTEFinalResult, QTEKeyBinding } from '@/engine/qte/qteTypes';

/**
 * Payload для `qte:start`.
 *
 * Эмиттер (сценарий, диалоговая система, движковая логика) описывает событие,
 * QuickTimeEventHost подхватывает его и монтирует QuickTimeEventOverlay.
 * Хост молча отбрасывает запрос, если QTE уже активен или экран занят
 * другой модальной презентацией (диалог/кат-сцена/миниигра/осмотр).
 */
export interface QteStartPayload {
  /** Уникальный идентификатор сессии QTE (для сопоставления resolve). */
  id: string;
  eventType: QTEEventType;
  keyBindings: QTEKeyBinding[];
  /** Длительность в мс до деления на speedMult сложности. */
  duration: number;
  difficulty?: QTEDifficulty;
  /** Цель нажатий для mash (по умолчанию 10). */
  targetPresses?: number;
  /** Произвольный контекст для слушателей qte:resolve. */
  context?: Record<string, unknown>;
}

/**
 * Payload для `qte:resolve`.
 *
 * Эмитится хостом ровно один раз на qte:start — по успеху, провалу,
 * тайм-ауту или отмене (Escape).
 */
export interface QteResolvePayload {
  id: string;
  result: QTEFinalResult;
}

/**
 * Payload для `qte:closed` (v4.31).
 *
 * Эмитится хостом ровно один раз на принятый qte:start — когда оверлей
 * полностью ушёл с экрана: при отмене (Escape) — сразу, при остальных
 * исходах — после экрана результата. В отличие от qte:resolve (логика
 * наград) здесь сигнал «экран свободен»: сценарные триггеры открывают
 * следующий шаг цепочки (миниигру, диалог) без наложения модалок.
 */
export interface QteClosedPayload {
  id: string;
  result: QTEFinalResult;
}

/** QTE start/resolve/closed — QuickTimeEventHost, сценарные триггеры. */
export interface QteEvents {
  'qte:start': QteStartPayload;
  'qte:resolve': QteResolvePayload;
  'qte:closed': QteClosedPayload;
}
