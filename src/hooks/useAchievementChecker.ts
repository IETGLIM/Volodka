
/* ─── Volodka RPG – Achievement Checker Hook ───
   Runs the AchievementEngine's checkAchievements() on game state changes.
   Also wires up combat events to the engine's tracking functions.

   ARCHITECTURE: The engine is a pure condition checker. It delegates
   unlocking to the store via tryUnlock() → store.unlockAchievement().
   No sync logic needed — the store IS the single source of truth. */

import { useEffect, useRef } from 'react';
import { shallow } from 'zustand/shallow';
import { useGameStore } from '@/store/gameStore';
import { readGamePhase } from '@/shared/gamePhase';
import { eventBus } from '@/engine/EventBus';
import {
  checkAchievements,
  initAchievementEngine,
  notifyCombatVictory,
  notifyCombatDefeat,
  notifyCombo,
  notifyCriticalHit,
  notifyPoemPowerUsed,
  type AchievementCheckState,
} from '@/engine/AchievementEngine';

/* ─── Hook ─── */

export function useAchievementChecker() {
  const initialized = useRef(false);

  // Initialize engine once (now a no-op, kept for backward compat)
  useEffect(() => {
    if (!initialized.current) {
      initialized.current = true;
      initAchievementEngine();
    }
  }, []);

  // Subscribe to combat events for tracking
  useEffect(() => {
    const unsubs: Array<() => void> = [];

    unsubs.push(eventBus.on('combat:victory', (payload) => {
      notifyCombatVictory(payload.enemyType);
    }));

    unsubs.push(eventBus.on('combat:defeat', () => {
      notifyCombatDefeat();
    }));

    unsubs.push(eventBus.on('poem:power_used', () => {
      notifyPoemPowerUsed();
    }));

    return () => {
      for (const unsub of unsubs) unsub();
    };
  }, []);

  // Check achievements only when achievement-relevant state changes
  useEffect(() => {
    const unsub = useGameStore.subscribe(
      (state): AchievementCheckState => ({
        mode: readGamePhase(state),
        currentSceneId: state.exploration.currentSceneId,
        collectedPoems: state.collectedPoems,
        karma: state.playerState.karma,
        energy: state.playerState.energy,
        stress: state.playerState.stress,
        npcRelations: state.npcRelations,
        flags: state.playerState.flags,
        timeOfDay: state.exploration.timeOfDay,
        unlockedAchievements: state.unlockedAchievements,
      }),
      (checkState) => {
        checkAchievements(checkState);
      },
      { equalityFn: shallow },
    );

    return unsub;
  }, []);
}
