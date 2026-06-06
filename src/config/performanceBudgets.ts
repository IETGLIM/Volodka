/**
 * Performance budget targets — shared by runtime monitors and CI bundle checks.
 * Source of truth: config/performanceBudgets.json
 */

import budgetsJson from '../../config/performanceBudgets.json';
import type { SceneId } from '@/config/sceneDefinitions';

export interface NumericBudget {
  target: number;
  hardMax: number;
  description?: string;
}

export interface FpsBudget {
  target: number;
  min: number;
}

export interface PerformanceBudgetsConfig {
  version: number;
  bootJsGzipBytes?: NumericBudget;
  gameStartJsGzipBytes?: NumericBudget;
  initialJsGzipBytes: NumericBudget;
  firstScenePlayableMs: NumericBudget;
  fps: {
    desktop: FpsBudget;
    weakLaptop: FpsBudget;
    sampleFrames: number;
    description?: string;
  };
  drawCalls: {
    defaultMax: number;
    warnRatio: number;
    perScene: Partial<Record<SceneId, number>>;
  };
  physicsStepMs: NumericBudget;
  reactRendersPerFrame: { warn: number; hardMax: number };
  zustandNotificationsPerFrame: { warn: number; hardMax: number };
  cpuFrameMs: NumericBudget;
  bundleTiers: {
    boot: string[];
    bootMenu?: string[];
    gameStart?: string[];
    firstScene: string[];
    lazyPrefixes: string[];
  };
}

export const PERFORMANCE_BUDGETS = budgetsJson as PerformanceBudgetsConfig;

export function getDrawCallBudget(sceneId: SceneId): number {
  return PERFORMANCE_BUDGETS.drawCalls.perScene[sceneId]
    ?? PERFORMANCE_BUDGETS.drawCalls.defaultMax;
}

export function getDrawCallWarnThreshold(sceneId: SceneId): number {
  return getDrawCallBudget(sceneId) * PERFORMANCE_BUDGETS.drawCalls.warnRatio;
}

/** Weak laptop heuristic — no benchmark API in browsers. */
export function isWeakLaptopProfile(): boolean {
  if (typeof navigator === 'undefined') return false;
  const cores = navigator.hardwareConcurrency ?? 8;
  const dpr = typeof window !== 'undefined' ? window.devicePixelRatio : 1;
  return cores <= 4 || dpr <= 1.25;
}

export function getActiveFpsBudget(): FpsBudget {
  return isWeakLaptopProfile()
    ? PERFORMANCE_BUDGETS.fps.weakLaptop
    : PERFORMANCE_BUDGETS.fps.desktop;
}
