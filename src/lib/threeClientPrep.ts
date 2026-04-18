/**
 * Должен импортироваться до `@react-three/fiber` / drei (см. первый импорт в `GameClient.tsx`).
 *
 * - **Clock**: в three r183+ `new THREE.Clock()` пишет deprecation; R3F всё ещё создаёт Clock в root state —
 *   подменяем на совместимую реализацию без предупреждения.
 * - **Audio**: задаём глобальный контекст three через объект опций, чтобы `AudioListener` / декод не шли
 *   через устаревший `new AudioContext()` без аргументов внутри three (где возможно).
 */
import * as THREE from 'three';
import { createBrowserAudioContext } from '@/lib/browserAudioContext';

const PREP_KEY = '__volodka_three_client_prep_v1';

function installFiberClockCompat(): void {
  class FiberClockCompat {
    autoStart: boolean;
    startTime = 0;
    oldTime = 0;
    elapsedTime = 0;
    running = false;

    constructor(autoStart = true) {
      this.autoStart = autoStart;
    }

    start(): void {
      this.startTime = performance.now();
      this.oldTime = this.startTime;
      this.elapsedTime = 0;
      this.running = true;
    }

    stop(): void {
      this.getElapsedTime();
      this.running = false;
      this.autoStart = false;
    }

    getElapsedTime(): number {
      this.getDelta();
      return this.elapsedTime;
    }

    getDelta(): number {
      let diff = 0;
      if (this.autoStart && !this.running) {
        this.start();
        return 0;
      }
      if (this.running) {
        const newTime = performance.now();
        diff = (newTime - this.oldTime) / 1000;
        this.oldTime = newTime;
        this.elapsedTime += diff;
      }
      return diff;
    }
  }

  (THREE as unknown as { Clock: new (autoStart?: boolean) => unknown }).Clock =
    FiberClockCompat as unknown as typeof THREE.Clock;
}

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

  installFiberClockCompat();
  installThreeSharedAudioContext();
}

ensureThreeClientPrep();
