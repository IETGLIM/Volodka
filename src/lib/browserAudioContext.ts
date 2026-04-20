/**
 * Один нативный `AudioContext` на вкладку: иначе three / эмбиент / SFX создают десятки контекстов
 * → «The AudioContext encountered an error from the audio device…» в Chrome и на Vercel.
 */
let sharedNativeAudioContext: AudioContext | null = null;

/**
 * Создание нативного Web Audio `AudioContext` с рекомендуемой формой опций
 * (без устаревшего вызова конструктора без объекта — меньше предупреждений в консоли Chromium).
 * Возвращает **тот же** экземпляр при повторных вызовах, пока контекст не `closed`.
 */
export function createBrowserAudioContext(): AudioContext | null {
  if (typeof window === 'undefined') return null;
  if (sharedNativeAudioContext && sharedNativeAudioContext.state !== 'closed') {
    return sharedNativeAudioContext;
  }
  const Ctor =
    window.AudioContext ||
    (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  if (!Ctor) return null;
  try {
    sharedNativeAudioContext = new Ctor({ latencyHint: 'interactive' } as AudioContextOptions) as AudioContext;
    return sharedNativeAudioContext;
  } catch {
    try {
      sharedNativeAudioContext = new Ctor() as AudioContext;
      return sharedNativeAudioContext;
    } catch {
      return null;
    }
  }
}
