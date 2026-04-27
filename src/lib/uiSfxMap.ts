/**
 * Опциональные файлы в `public/audio/` для `AudioEngine.playSfx`.
 * При отсутствии файла — процедурный fallback в `AudioEngine.playSfxBeep`.
 */
export const UI_SFX_FILE_OVERRIDES: Partial<Record<string, string>> = {
  ui_success: '/audio/ui/success.wav',
  ui_fail: '/audio/ui/fail.wav',
};
