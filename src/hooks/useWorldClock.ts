'use client';

/* ─── Volodka RPG – World Clock Hook ─── */
/* Provides a periodic world tick that drives NPC schedules, weather,
 * quest time limits, and achievement checks. The world is always
 * simulating, even when the player isn't looking at a scene.
 *
 * This is the single pulse that turns a "visual novel with 3D backdrop"
 * into a "living hub city" — the core of the World Director pattern.
 *
 * Tick sources:
 * 1. Periodic interval → advanceTime() → schedule:sync_npcs
 * 2. Manual advanceTime() / fastTravelTo in explorationSlice
 * 3. world:hour_changed from scheduleSyncController
 *
 * On each tick:
 *  - advanceTime rebuilds NPC states via schedule:sync_npcs
 *  - world:tick event is emitted for downstream systems
 *  - Quest time limits are checked
 *  - Weather cycles are evaluated
 */

import { useEffect, useRef } from 'react';
import { useGameStore } from '@/store/gameStore';
import { readGamePhase } from '@/shared/gamePhase';
import { useGamePhase } from '@/store/selectors';
import { eventBus } from '@/engine/EventBus';

/** How often the world clock ticks in seconds (game minutes per tick) */
const WORLD_TICK_INTERVAL_S = 60; // Every 60 real seconds = 1 game hour

/** How many game hours pass per periodic tick */
const HOURS_PER_TICK = 0.25; // 15 game minutes per tick

/**
 * World Clock hook — call once in GameOrchestrator.
 * Ticks the world forward periodically and keeps NPC states synchronized.
 */
export function useWorldClock() {
  const mode = useGamePhase();

  useEffect(() => {
    // Only tick when the player is in exploration mode (the "living world" mode)
    // Combat, cutscene, and menu pause the world clock
    if (mode !== 'exploration') return;

    const interval = setInterval(() => {
      const store = useGameStore.getState();
      // Double-check we're still in exploration
      if (readGamePhase(store) !== 'exploration') return;

      // advanceTime → schedule:sync_npcs → NPC rebuild + world:hour_changed
      store.advanceTime(HOURS_PER_TICK);
      const hour = useGameStore.getState().exploration.timeOfDay;
      eventBus.emit('world:tick', { hour, deltaHours: HOURS_PER_TICK });
    }, WORLD_TICK_INTERVAL_S * 1000);

    return () => clearInterval(interval);
  }, [mode]);

  // ── Initialize NPC states on mount (no time advance) ──
  const initRef = useRef(false);
  useEffect(() => {
    if (initRef.current) return;
    initRef.current = true;

    const hour = useGameStore.getState().exploration.timeOfDay;
    eventBus.emit('schedule:sync_npcs', { hour, previousHour: hour });
  }, []);
}
