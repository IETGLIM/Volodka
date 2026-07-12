
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
import { eventBus, EventBusPriority } from '@/engine/EventBus';
import { withHmrCleanup } from '@/shared/dev/hmrDispose';
import { dispatchGameAction } from '@/engine/GameActionDispatcher';
import {
  checkAchievements,
  initAchievementEngine,
  notifyCombatVictory,
  notifyCombatDefeat,
  notifyPoemPowerUsed,
  type AchievementCheckState } from '@/engine/AchievementEngine';

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
    const scope = eventBus.createScope();

    scope.on('combat:victory', (payload) => {
      notifyCombatVictory(payload.enemyType);
    }, EventBusPriority.Orchestrator);

    scope.on('combat:defeat', () => {
      notifyCombatDefeat();
    }, EventBusPriority.Orchestrator);

    scope.on('poem:power_used', () => {
      notifyPoemPowerUsed();
    });

    scope.on('choice:made', (payload) => {
      if (payload.karmaChange !== 0) {
        dispatchGameAction({ type: 'achievement/trackKarmaChoice', karmaDelta: payload.karmaChange });
      }
    }, EventBusPriority.Orchestrator);

    return withHmrCleanup(() => scope.dispose());
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
        unlockedAchievements: state.unlockedAchievements }),
      (checkState) => {
        checkAchievements(checkState);
      },
      { equalityFn: shallow },
    );

    return unsub;
  }, []);
}
