import type { RootState } from '@react-three/fiber';
import type { FrameGameSnapshot } from './frameGameSnapshot';

/**
 * Frame pipeline order — aligned with R3F useFrame priorities (lower runs first).
 *
 * 1. pre_physics  (−1000) — input, interaction prep, kinematic targets
 * 2. physics      (0)     — Rapier world.step via <Physics updatePriority={0} />
 * 3. post_physics (100)   — read post-step transforms, player finalize
 * 4. pre_render   (500)   — camera, animations, weather, misc visuals
 * 5. post_render  (1000)  — profiler, canvas guards (after draw stats)
 */
export const FRAME_PHASE_ORDER = [
  'pre_physics',
  'physics',
  'post_physics',
  'pre_render',
  'post_render',
] as const;

export type FramePipelinePhase = (typeof FRAME_PHASE_ORDER)[number];

/** Phases executed by FrameBudgetRunner / PostFrameBudgetRunner (excludes Rapier physics). */
export type FrameTickPhase = Exclude<FramePipelinePhase, 'physics'>;

/** @deprecated Use FrameTickPhase — mapped by normalizeFrameTickPhase(). */
export type LegacyFrameTickPhase = 'pre' | 'post';

export const FRAME_PHASE_R3F_PRIORITY: Record<FrameTickPhase, number> = {
  pre_physics: -1000,
  post_physics: 100,
  pre_render: 500,
  post_render: 1000,
};

export const FRAME_PHYSICS_R3F_PRIORITY = 0;

export function normalizeFrameTickPhase(
  phase: FrameTickPhase | LegacyFrameTickPhase = 'pre_render',
): FrameTickPhase {
  switch (phase) {
    case 'pre':
      return 'pre_render';
    case 'post':
      return 'post_render';
    case 'pre_physics':
    case 'post_physics':
    case 'pre_render':
    case 'post_render':
      return phase;
    default: {
      const _exhaustive: never = phase;
      return _exhaustive;
    }
  }
}

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

export const FRAME_BUDGET_MS = 1000 / 60;

export interface FrameTickContext {
  state: RootState;
  delta: number;
  /** Store snapshot captured once before pre_physics ticks. */
  game: FrameGameSnapshot;
}

export type FrameTickCallback = (ctx: FrameTickContext) => void;

export interface FrameTickOptions {
  priority?: number;
  label?: string;
  enabled?: boolean;
  phase?: FrameTickPhase | LegacyFrameTickPhase;
}

export interface RegisteredFrameTick {
  id: number;
  system: FrameSystemId;
  priority: number;
  label: string;
  enabled: boolean;
  phase: FrameTickPhase;
  callback: FrameTickCallback;
}
