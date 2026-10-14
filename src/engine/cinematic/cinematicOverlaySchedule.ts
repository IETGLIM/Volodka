/**
 * Wall-clock overlay scheduling for cinematic timelines (FIX v4.48.20, P2).
 *
 * PROBLEM: timeline overlays were emitted ONLY from the runner's frame-tick
 * path, on the first tick of the owning phase. The tick loop is frame-clock
 * driven (dt clamped to 0.05s — cinematicTimelineController), while the
 * runner's fallback timer is wall-clock driven ((total + 2s)·1000). On any
 * machine below ~20 fps the frame clock lags behind the wall clock, the
 * fallback fires first, and tail-phase overlays (intro_wakeup: monitor at
 * 16.0s, handoff title «Володька.» at 20.0s) NEVER reach their first tick —
 * the emit is lost. In a throttled/headless browser (~2 rAF/s) the loss is
 * total: 0 overlay occurrences across entire runs (QA v4.48.19, 3 прогонов).
 *
 * FIX: schedule each overlay beat as a wall-clock timeout at the owning
 * phase's start offset. Wall-clock timers fire regardless of rAF throttling.
 * The frame-tick path stays (frame-accurate alignment on healthy machines)
 * and both paths share a once-only emit guard — see
 * CinematicTimelineRunner.emitPhaseOverlay.
 */

import type { CinematicTimelineDef } from './cinematicTimelineTypes';

export interface TimelineOverlayBeat {
  /** Index into def.phases of the phase owning the overlay. */
  phaseIndex: number;
  /** Wall-clock offset from timeline start (ms) at which the beat fires. */
  atMs: number;
}

/**
 * Pure schedule computation: every phase with an overlay gets one beat at the
 * phase's start offset (mirrors the tick path, which emits on the phase's
 * first tick). Phases with letterboxStyle 'none' are skipped — the tick path
 * never emitted those either.
 */
export function computeTimelineOverlaySchedule(
  def: CinematicTimelineDef,
): TimelineOverlayBeat[] {
  const beats: TimelineOverlayBeat[] = [];
  let acc = 0;
  def.phases.forEach((phase, i) => {
    const startMs = acc;
    acc += Math.max(0, phase.duration) * 1000;
    if (!phase.overlay) return;
    if (phase.overlay.letterboxStyle === 'none') return;
    beats.push({ phaseIndex: i, atMs: startMs });
  });
  return beats;
}

/**
 * Overlay durationMs: the remaining timeline from the owning phase to the
 * end (matches the tick path's v4.17.1 contract — the text must not fade
 * before the camera finishes). Falls back to 2000ms for degenerate defs.
 */
export function timelineRemainingMs(
  def: CinematicTimelineDef,
  phaseIndex: number,
): number {
  const remainingMs =
    def.phases
      .slice(phaseIndex)
      .reduce((sum, p) => sum + Math.max(0, p.duration), 0) * 1000;
  return remainingMs > 0 ? remainingMs : 2000;
}
