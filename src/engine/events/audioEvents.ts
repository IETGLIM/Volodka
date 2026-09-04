/** Audio / SFX events — consumed by useAudioOrchestrator, QuickUseBar. */
export interface AudioEvents {
  /**
   * Sound play event. The base contract requires only `type` (e.g. 'item_use',
   * 'ui_click'). The QuickUseBar extends the payload with optional slot/item
   * metadata so the QuickUseCooldownOverlay can render a per-slot cooldown ring
   * without requiring a separate event bus channel.
   */
  'sound:play': {
    type: string;
    /** Slot index that triggered the sound (QuickUseBar item use). */
    slotIndex?: number;
    /** Item ID that triggered the sound (QuickUseBar item use). */
    itemId?: string;
    /** Cooldown duration in milliseconds (QuickUseBar item use). */
    cooldownMs?: number;
  };
  'audio:ambient_stinger': {
    cue: string;
  };
  /**
   * Реплика с озвучкой началась (VO-файл или синтез речи).
   * Payload слушает VoiceLineSubtitleHud — субтитры голосовых линий.
   */
  'audio:voice_line_start': {
    nodeId: string;
    /** Имя говорящего для субтитра (уже локализовано; null — «Голос»). */
    speaker: string | null;
    /** Текст реплики. Отсутствует — субтитр не рисуем (нечего показывать). */
    text?: string;
  };
  /** Реплика закончилась (естественно, ошибкой или принудительным стопом). */
  'audio:voice_line_end': {
    nodeId: string;
  };
}
