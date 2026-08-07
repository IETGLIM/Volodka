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
  /** Lux atmospheric boost during cinematic beats — mist + shafts denser */
  'cinematic:atmosphere_boost': { intensity: number; sceneId?: string };
}
