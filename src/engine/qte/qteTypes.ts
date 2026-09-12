/**
 * Общие типы QTE-подсистемы (быстрых событий).
 *
 * Живут в engine-слое, чтобы и EventBus-домен (qteEvents), и React-оверлей
 * (QuickTimeEventOverlay) зависели от одного нейтрального источника
 * (направление импорта: компонент → engine, как и для остальных доменов).
 */

/** Типы QTE событий / QTE event types */
export type QTEEventType =
  | 'press'      // Однократное нажатие / Single press
  | 'hold'       // Удержание клавиши / Hold key down
  | 'mash'       // Быстрые повторные нажатия / Rapid repeated presses (mash)
  | 'sequence';  // Последовательность клавиш / Key sequence

/** Клавишная привязка для QTE / Key binding for QTE */
export interface QTEKeyBinding {
  /** Отображаемая метка клавиши / Display label for key */
  display: string;
  /** Фактический код клавиши (для обработки) / Actual key code */
  code: string;
  /** Иконка (опционально) / Icon element (optional) */
  icon?: React.ReactNode;
}

/** Уровни сложности / Difficulty levels */
export type QTEDifficulty = 'easy' | 'normal' | 'hard' | 'extreme' | 'impossible';

/** Результат QTE / QTE result type */
export type QTEResult = 'success' | 'failure' | 'timeout' | 'cancelled' | 'pending';

/** Итоговый результат (без служебного «pending») / Terminal results only. */
export type QTEFinalResult = Exclude<QTEResult, 'pending'>;
