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
 * 1. Periodic interval (every WORLD_TICK_INTERVAL_S seconds during exploration)
 * 2. advanceTime() in explorationSlice (fast travel, rest, story events)
 * 3. world:hour_changed events from any source
 *
 * On each tick:
 *  - NPC states are rebuilt via buildNPCStatesForTime()
 *  - world:tick event is emitted for downstream systems
 *  - Quest time limits are checked
 *  - Weather cycles are evaluated
 */

import { useEffect, useRef } from 'react';
import { useGameStore } from '@/store/gameStore';
import { readGamePhase } from '@/shared/gamePhase';
import { useGamePhase } from '@/store/selectors';
import { eventBus } from '@/engine/EventBus';
import { buildNPCStatesForTime } from '@/engine/ScheduleEngine';
import { buildScheduleContext } from '@/shared/scheduleContext';
import { isGameplayOverlayLocomotionLocked } from '@/engine/player/playerLocomotionGate';
import {
  WORLD_CLOCK_HOURS_PER_TICK,
  WORLD_CLOCK_TICK_INTERVAL_S,
} from '@/engine/world/worldClockConstants';

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
      // Pause time while any panel is open (inventory, quests, pause menu, etc.)
      // This mirrors the locomotion gate — if the player can't move, time shouldn't advance.
      if (isGameplayOverlayLocomotionLocked()) return;

      const store = useGameStore.getState();
      // Double-check we're still in exploration
      if (readGamePhase(store) !== 'exploration') return;

      const previousHour = store.exploration.timeOfDay;
      // Advance time by a small increment
      const newHour = (previousHour + WORLD_CLOCK_HOURS_PER_TICK) % 24;

      // Rebuild NPC states for the new time
      const scheduleCtx = buildScheduleContext(store);
      const npcStates = buildNPCStatesForTime(newHour, scheduleCtx);

      // Update store with new time and NPC states
      store.setExplorationTimeOfDay(newHour);
      store.setExplorationNPCStates(npcStates);

      // Emit world events for downstream systems (NPC schedules, weather, quest timers).
      eventBus.emit('world:tick', { hour: newHour, deltaHours: WORLD_CLOCK_HOURS_PER_TICK });
      eventBus.emit('world:hour_changed', {
        hour: newHour,
        previousHour,
        npcStates,
      });
    }, WORLD_CLOCK_TICK_INTERVAL_S * 1000);

    return () => clearInterval(interval);
  }, [mode]);

  // ── Initialize NPC states on mount / scene change ──
  const initRef = useRef(false);
  useEffect(() => {
    if (initRef.current) return;
    initRef.current = true;

    const store = useGameStore.getState();
    const hour = store.exploration.timeOfDay;
    const scheduleCtx = buildScheduleContext(store);
    const npcStates = buildNPCStatesForTime(hour, scheduleCtx);
    store.setExplorationNPCStates(npcStates);
  }, []);
}
