/* ─── Volodka RPG – настройка «Озвучка реплик (синтез речи)» (v4.8.5) ───
 *
 * Опциональная озвучка голосовых линий через Web Speech API (speechSynthesis).
 * Дефолт ВЫКЛ: качество синтеза зависит от платформы, поэтому фича — осознанный
 * opt-in (доступность: игроки с ограничением зрения; комфорт: можно слушать,
 * а не читать). Вместе с озвучкой рисуются субтитры реплики
 * (VoiceLineSubtitleHud), масштабируемые через --subtitle-scale.
 *
 * Чистый модуль: чтение/запись localStorage + дефолт (паттерн
 * arrivalCinematicsSetting). UI-тумблер — SettingsPanel, вкладка «Аудио».
 */

const LS_KEY = 'volodka_voice_over_enabled';

/** Дефолт: озвучка ВЫКЛЮЧЕНА (синтез речи — opt-in). */
export const VOICE_OVER_DEFAULT = false;

/** Read persisted voice-over preference (safe on SSR / private mode). */
export function readVoiceOverEnabled(): boolean {
  if (typeof window === 'undefined') return VOICE_OVER_DEFAULT;
  try {
    const raw = localStorage.getItem(LS_KEY);
    if (raw === null) return VOICE_OVER_DEFAULT;
    return raw === 'true';
  } catch {
    return VOICE_OVER_DEFAULT;
  }
}

/** Persist voice-over preference (silent degradation without storage). */
export function writeVoiceOverEnabled(enabled: boolean): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(LS_KEY, String(enabled));
  } catch {
    /* private mode — настройка просто не переживёт перезагрузку */
  }
}

/** Найден ли русский голос в системе (для подсказки в настройках). */
export function hasRussianVoice(): boolean {
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) return false;
  try {
    return window.speechSynthesis.getVoices().some((v) => v.lang?.toLowerCase().startsWith('ru'));
  } catch {
    return false;
  }
}
