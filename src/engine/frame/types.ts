import type { RootState } from '@react-three/fiber';

/** Ordered frame systems — lower index runs earlier in the budget. */
export type FrameSystemId =
  | 'interaction'
  | 'player'
  | 'npc'
  | 'camera'
  | 'weather'
  | 'postfx'
  | 'misc';

export const FRAME_SYSTEM_ORDER: readonly FrameSystemId[] = [
  'interaction',
  'player',
  'npc',
  'camera',
  'weather',
  'postfx',
  'misc',
] as const;

/**
 * Soft-skip policy (Phase 4/6 P0):
 * - Critical systems always run: interaction, player, npc, camera
 *   (input / physics / combat / NPC AI / camera — gameplay-critical).
 * - Skippable: weather, postfx, misc (VFX / atmosphere / cosmetic).
 * - Within a pre-render frame, ticks run in system + priority order.
 *   Once cumulative CPU exceeds FRAME_BUDGET_MS, remaining non-critical
 *   ticks are soft-skipped for that frame; critical ticks still run.
 * - Per-tick override: FrameTickOptions.critical.
 * - Post-render ticks never soft-skip (profiler / canvas guards).
 */
export const CRITICAL_FRAME_SYSTEMS: ReadonlySet<FrameSystemId> = new Set([
  'interaction',
  'player',
  'npc',
  'camera',
]);

/** 16.67 ms @ 60 fps — soft budget target for all CPU systems combined. */
export const FRAME_BUDGET_MS = 1000 / 60;

export interface FrameTickContext {
  state: RootState;
  delta: number;
}

export type FrameTickCallback = (ctx: FrameTickContext) => void;

export type FrameTickPhase = 'pre' | 'post';

export interface FrameTickOptions {
  /** Lower runs earlier within the same system. Default 0. */
  priority?: number;
  /** DevPanel label — defaults to anonymous tick id. */
  label?: string;
  /** Skip when false without unregistering. Default true. */
  enabled?: boolean;
  /** Pre-render (default) or post-render (after WebGL draw). */
  phase?: FrameTickPhase;
  /**
   * Soft-skip override. Default: true for CRITICAL_FRAME_SYSTEMS, false otherwise.
   * Critical ticks always run; non-critical may be skipped when over FRAME_BUDGET_MS.
   */
  critical?: boolean;
}

export interface RegisteredFrameTick {
  id: number;
  system: FrameSystemId;
  priority: number;
  label: string;
  enabled: boolean;
  phase: FrameTickPhase;
  critical: boolean;
  callback: FrameTickCallback;
}

/** Resolve effective criticality for a tick (explicit override or system default). */
export function isFrameSystemCritical(
  system: FrameSystemId,
  override?: boolean,
): boolean {
  if (override !== undefined) return override;
  return CRITICAL_FRAME_SYSTEMS.has(system);
}
