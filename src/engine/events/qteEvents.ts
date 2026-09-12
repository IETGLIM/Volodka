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

/** QTE start/resolve — QuickTimeEventHost, сценарные триггеры. */
export interface QteEvents {
  'qte:start': QteStartPayload;
  'qte:resolve': QteResolvePayload;
}
