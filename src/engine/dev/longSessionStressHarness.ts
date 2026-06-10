/**
 * Dev-only long-session stress harness — auto scene hops + combat loops.
 * Logs heap/FPS via FrameBudgetRegistry / performance.memory.
 * Enable from DevPanel (F3 → Cheats) or `window.__volodkaStress.start()`.
 */

import { eventBus } from '@/engine/EventBus';
import { getGameStore } from '@/store/gameStore';
import { SCENE_CONFIG } from '@/config/scenes';
import { requestSceneTransition } from '@/engine/scene/sceneTransition';
import { disposeCombatSystem, startCombat } from '@/engine/CombatSystem';
import { getRegisteredTickCount, getTotalBudgetCpuMs } from '@/engine/frame/FrameBudgetRegistry';
import type { SceneId } from '@/shared/types/game';

export interface StressHarnessSample {
  t: number;
  heapUsedMb: number | null;
  fps: number;
  frameCpuMs: number;
  registeredTicks: number;
  sceneId: string;
}

export interface StressHarnessReport {
  startedAt: number;
  endedAt: number;
  durationMs: number;
  samples: StressHarnessSample[];
  heapGrowthPercent: number | null;
  minFps: number;
  avgFps: number;
}

const DEFAULT_SCENES: SceneId[] = ['volodka_room', 'street_night', 'volodka_corridor', 'cafe_evening'];

export class LongSessionStressHarness {
  private running = false;
  private timer: ReturnType<typeof setInterval> | null = null;
  private rafId = 0;
  private samples: StressHarnessSample[] = [];
  private startedAt = 0;
  private sceneIndex = 0;
  private combatToggle = false;
  private lastFrame = performance.now();
  private fpsWindow: number[] = [];

  start(options?: { durationMs?: number; sceneIds?: SceneId[]; intervalMs?: number }): void {
    if (this.running) return;
    const durationMs = options?.durationMs ?? 5 * 60_000;
    const intervalMs = options?.intervalMs ?? 8000;
    const scenes = options?.sceneIds ?? DEFAULT_SCENES;

    this.running = true;
    this.samples = [];
    this.startedAt = performance.now();
    this.sceneIndex = 0;
    this.combatToggle = false;
    this.fpsWindow = [];
    this.lastFrame = performance.now();

    const tickFps = () => {
      if (!this.running) return;
      const now = performance.now();
      const dt = now - this.lastFrame;
      this.lastFrame = now;
      if (dt > 0) {
        this.fpsWindow.push(1000 / dt);
        if (this.fpsWindow.length > 120) this.fpsWindow.shift();
      }
      this.rafId = requestAnimationFrame(tickFps);
    };
    this.rafId = requestAnimationFrame(tickFps);

    this.recordSample();

    this.timer = setInterval(() => {
      if (!this.running) return;

      const sceneId = scenes[this.sceneIndex % scenes.length];
      this.sceneIndex += 1;
      const config = SCENE_CONFIG[sceneId];
      if (config) {
        requestSceneTransition(sceneId, config.spawnPoint as [number, number, number]);
      }

      this.combatToggle = !this.combatToggle;
      if (this.combatToggle) {
        disposeCombatSystem();
        startCombat('system_daemon');
        eventBus.emit('combat:start', { enemyType: 'system_daemon' });
      } else {
        disposeCombatSystem();
        getGameStore().setCombatActive(false);
        eventBus.emit('combat:end', {});
      }

      this.recordSample();

      if (performance.now() - this.startedAt >= durationMs) {
        this.stop();
      }
    }, intervalMs);
  }

  stop(): StressHarnessReport {
    this.running = false;
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
    if (this.rafId) {
      cancelAnimationFrame(this.rafId);
      this.rafId = 0;
    }
    disposeCombatSystem();
    getGameStore().setCombatActive(false);

    const endedAt = performance.now();
    const heaps = this.samples.map((s) => s.heapUsedMb).filter((h): h is number => h !== null);
    const heapGrowthPercent =
      heaps.length >= 2 && heaps[0] > 0
        ? ((heaps[heaps.length - 1] - heaps[0]) / heaps[0]) * 100
        : null;
    const fpsValues = this.samples.map((s) => s.fps).filter((f) => f > 0);
    const minFps = fpsValues.length ? Math.min(...fpsValues) : 0;
    const avgFps = fpsValues.length ? fpsValues.reduce((a, b) => a + b, 0) / fpsValues.length : 0;

    const report: StressHarnessReport = {
      startedAt: this.startedAt,
      endedAt,
      durationMs: endedAt - this.startedAt,
      samples: [...this.samples],
      heapGrowthPercent,
      minFps,
      avgFps,
    };

    console.info('[Volodka:StressHarness] Report', report);
    return report;
  }

  isRunning(): boolean {
    return this.running;
  }

  getSamples(): readonly StressHarnessSample[] {
    return this.samples;
  }

  private recordSample(): void {
    const mem = (performance as Performance & { memory?: { usedJSHeapSize: number } }).memory;
    const heapUsedMb = mem ? mem.usedJSHeapSize / (1024 * 1024) : null;
    const fps =
      this.fpsWindow.length > 0
        ? this.fpsWindow.reduce((a, b) => a + b, 0) / this.fpsWindow.length
        : 0;

    this.samples.push({
      t: performance.now() - this.startedAt,
      heapUsedMb,
      fps,
      frameCpuMs: getTotalBudgetCpuMs(),
      registeredTicks: getRegisteredTickCount(),
      sceneId: getGameStore().exploration.currentSceneId,
    });
  }
}

let harnessInstance: LongSessionStressHarness | null = null;

export function getLongSessionStressHarness(): LongSessionStressHarness {
  if (!harnessInstance) {
    harnessInstance = new LongSessionStressHarness();
  }
  return harnessInstance;
}

declare global {
  interface Window {
    __volodkaStress?: LongSessionStressHarness;
  }
}

/** Expose harness on window in dev for manual QA. */
export function installStressHarnessDevGlobal(): void {
  if (import.meta.env.DEV && typeof window !== 'undefined') {
    window.__volodkaStress = getLongSessionStressHarness();
  }
}
