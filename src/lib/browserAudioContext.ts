/**
 * Создание нативного Web Audio `AudioContext` с рекомендуемой формой опций
 * (без устаревшего вызова конструктора без объекта — меньше предупреждений в консоли Chromium).
 */
export function createBrowserAudioContext(): AudioContext | null {
  if (typeof window === 'undefined') return null;
  const Ctor =
    window.AudioContext ||
    (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  if (!Ctor) return null;
  try {
    return new Ctor({ latencyHint: 'interactive' } as AudioContextOptions) as AudioContext;
  } catch {
    try {
      return new Ctor() as AudioContext;
    } catch {
      return null;
    }
  }
}
