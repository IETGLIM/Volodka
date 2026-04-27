/**
 * Опциональные файлы в `public/audio/` для `AudioEngine.playSfx`.
 * Значение — один путь или список (случайный выбор в `AudioEngine`).
 * При отсутствии файла — процедурный fallback в `AudioEngine.playSfxBeep`.
 */
export const UI_SFX_FILE_OVERRIDES: Partial<Record<string, string | string[]>> = {
  ui_success: ['/audio/ui/success_1.wav', '/audio/ui/success_2.wav'],
  ui_fail: ['/audio/ui/fail_1.wav', '/audio/ui/fail_2.wav'],
};
