/** Unified cinematic timeline — CinematicTimelineRunner + orchestrator. */

import type {
  CinematicTimelineDef,
  CinematicTimelineRuntimeOptions,
} from '@/engine/cinematic/cinematicTimelineTypes';

export interface CinematicTimelineEvents {
  'cinematic:timeline_start': {
    def: CinematicTimelineDef;
    options: CinematicTimelineRuntimeOptions;
    totalDurationSec: number;
    fallbackMs?: number;
  };
  'cinematic:timeline_stop': { timelineId: string };
  'cinematic:timeline_skip': { timelineId: string };
  'cinematic:timeline_complete': { timelineId: string; skipped?: boolean };
  'cinematic:timeline_phase': {
    timelineId: string;
    phaseId: string;
    phaseIndex: number;
    lightCue?: 'neon_surge' | 'dim_hold' | 'warm_practical';
  };
  'cinematic:atmosphere_boost': {
    intensity: number;
    sceneId?: string;
    duration?: number;
  };
  // Session 12-B: removed the orphaned `cinematic:intro_handoff` event
  // declaration — grep confirmed zero subscribers across the codebase. The
  // emit in CinematicTimelineRunner was also removed. The handoff semantic
  // is covered by `cinematic:timeline_phase` (phaseId) emitted above.
}
