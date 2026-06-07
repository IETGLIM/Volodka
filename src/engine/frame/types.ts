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
