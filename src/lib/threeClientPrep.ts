/**
 * Должен импортироваться до `@react-three/fiber` / drei (см. первый импорт в `GameClient.tsx`).
 *
 * - **Clock**: раньше здесь подменяли `THREE.Clock` для three r183+ / R3F. С пакетным `import * as THREE`
 *   объект `THREE` — namespace ES-модуля: свойства экспортов **нельзя перезаписать** (`Cannot set property Clock…`).
 *   Патч отключён; при необходимости тише консоль — обновление `@react-three/fiber` под актуальный three.
 * - **Audio**: задаём глобальный контекст three через объект опций, чтобы `AudioListener` / декод не шли
 *   через устаревший `new AudioContext()` без аргументов внутри three (где возможно).
 */
import * as THREE from 'three';
import { createBrowserAudioContext } from '@/lib/browserAudioContext';

const PREP_KEY = '__volodka_three_client_prep_v1';

function installThreeSharedAudioContext(): void {
  try {
    const ctx = createBrowserAudioContext();
    if (ctx) {
      THREE.AudioContext.setContext(ctx);
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

ensureThreeClientPrep();
