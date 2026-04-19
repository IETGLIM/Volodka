/**
 * Вызывать из `GameClient` **до** монтирования `<Canvas>` (до первого `@react-three/fiber`).
 *
 * - Не используем `import * as THREE` здесь: у namespace three в бандле экспорты только с геттерами;
 *   сторонний код при `THREE.Clock = …` даёт `Cannot set property Clock…`. Берём только **`AudioContext`** из three.
 * - **Audio**: один нативный контекст (`createBrowserAudioContext`) → `THREE.AudioContext.setContext`, чтобы
 *   внутри three не вызывался устаревший `new AudioContext()` без опций (где возможно).
 */
import { AudioContext as ThreeAudioContext } from 'three';
import { createBrowserAudioContext } from '@/lib/browserAudioContext';

const PREP_KEY = '__volodka_three_client_prep_v1';

function installThreeSharedAudioContext(): void {
  try {
    const ctx = createBrowserAudioContext();
    if (ctx) {
      ThreeAudioContext.setContext(ctx);
    }
  } catch {
    /* оставляем поведение three по умолчанию */
  }
}

export function ensureThreeClientPrep(): void {
  if (typeof window === 'undefined') return;
  const g = globalThis as unknown as Record<string, boolean>;
  if (g[PREP_KEY]) return;
  g[PREP_KEY] = true;

  installThreeSharedAudioContext();
}
