/**
 * Volodka RPG – Optimized Zustand Store Selectors
 * Reduces unnecessary re-renders with shallow comparison and memoization
 */

import { useCallback, useRef, useState, useEffect } from 'react';
import { useShallow } from 'zustand/react/shallow';
import { useGameStore } from './gameStore';
import { QUEST_DEFINITIONS } from '@/data/quests';

/* ═══════════════════════════════════════════════════════════════
   Type-safe shallow selectors for common use cases
   ═══════════════════════════════════════════════════════════════ */

/**
 * Selector for player stats only - most common HUD use case
 * Re-renders only when these specific values change
 */
export function usePlayerStats() {
  return useGameStore(
    useShallow((s) => ({
      energy: s.playerState.energy,
      stress: s.playerState.stress,
      karma: s.playerState.karma,
      credits: s.playerState.credits,
      level: s.playerState.progression.level,
      xp: s.playerState.progression.xp,
      xpToNextLevel: s.playerState.progression.xpToNextLevel,
    }))
  );
}

/**
 * Selector for player position and scene - used by 3D components
 */
export function useExplorationState() {
  return useGameStore(
    useShallow((s) => ({
      currentSceneId: s.exploration.currentSceneId,
      timeOfDay: s.exploration.timeOfDay,
      playerPosition: s.exploration.playerPosition,
      discoveredScenes: s.discoveredScenes,
    }))
  );
}

/**
 * Selector for game mode - used by orchestrator
 */
export function useGameMode() {
  return useGameStore((s) => s.mode);
}

/**
 * Selector for dialogue state
 */
export function useDialogueState() {
  return useGameStore(
    useShallow((s) => ({
      currentNodeId: s.currentNodeId,
      showStoryOverlay: s.showStoryOverlay,
      visitedNodes: s.playerState.visitedNodes,
    }))
  );
}

/**
 * Selector for inventory - used by inventory panel
 */
export function useInventory() {
  return useGameStore(
    useShallow((s) => ({
      items: s.playerState.inventory,
      equippedItems: s.playerState.equippedItems,
      maxSlots: 20, // MAX_INVENTORY_SLOTS
    }))
  );
}

/**
 * Selector for NPC relations - used by relationship panel
 */
export function useNPCRelations() {
  return useGameStore(
    useShallow((s) => ({
      relations: s.npcRelations,
      affinity: s.npcAffinity,
    }))
  );
}

/**
 * Selector for quests - used by quest panel
 */
export function useQuests() {
  return useGameStore(
    useShallow((s) => ({
      activeQuests: s.quests.filter((q) => q.status === 'active'),
      completedQuests: s.quests.filter((q) => q.status === 'completed'),
      failedQuests: s.quests.filter((q) => q.status === 'failed'),
    }))
  );
}

/**
 * Selector for weather and time - used by environmental systems
 */
export function useWorldState() {
  return useGameStore(
    useShallow((s) => ({
      timeOfDay: s.exploration.timeOfDay,
      weatherEnabled: s.exploration.weatherEnabled,
      rainIntensity: s.exploration.rainIntensity,
    }))
  );
}

/**
 * Selector for skills and progression
 */
export function usePlayerProgression() {
  return useGameStore(
    useShallow((s) => ({
      skills: s.playerState.skills,
      level: s.playerState.progression.level,
      skillPoints: s.playerState.progression.skillPoints,
      perkPoints: s.playerState.progression.perkPoints,
      unlockedSkills: s.playerState.progression.unlockedSkills,
      unlockedPerks: s.playerState.progression.unlockedPerks,
      currentAct: s.playerState.progression.currentAct,
    }))
  );
}

/**
 * Selector for collected poems
 */
export function usePoetryCollection() {
  return useGameStore(
    useShallow((s) => ({
      collectedPoems: s.playerState.collectedPoems,
      poemPower: s.playerState.poemPower,
      activePoemPower: s.playerState.activePoemPower,
    }))
  );
}

/* ═══════════════════════════════════════════════════════════════
   Debounced selector for expensive computations
   ═══════════════════════════════════════════════════════════════ */

/**
 * Hook that debounces store updates to reduce re-renders
 * Useful for rapidly changing values like player position
 */
export function useDebouncedSelector<T>(
  selector: (state: ReturnType<typeof useGameStore.getState>) => T,
  delay: number = 100
): T {
  const value = useGameStore(selector);
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);
    return () => clearTimeout(timer);
  }, [value, delay]);

  return debouncedValue;
}

/* ═══════════════════════════════════════════════════════════════
   Batch action creators to reduce store updates
   ═══════════════════════════════════════════════════════════════ */

/**
 * Hook that provides batched actions for common operations
 * Each batch action performs multiple state updates in a single transaction
 */
export function useBatchActions() {
  /**
   * Rest and recover - combines time advancement with stat recovery
   */
  const restAndRecover = useCallback((hours: number = 8) => {
    const store = useGameStore.getState();
    const currentScene = store.exploration.currentSceneId;
    if (currentScene !== 'volodka_room' && currentScene !== 'home_evening') return;

    // Batch: advance time + recover stats
    store.advanceTime(hours);
    store.addEnergy(100 - store.playerState.energy); // Fill to 100
    store.addStress(-30);
    store.pushNotification('energy', 'Отдых завершён');
  }, []);

  /**
   * Complete quest with rewards - handles quest completion + XP + items
   */
  const completeQuestWithRewards = useCallback((questId: string) => {
    const store = useGameStore.getState();
    const quest = store.quests.find(q => q.questId === questId);
    if (!quest) return;
    const questDef = QUEST_DEFINITIONS.find((q) => q.id === quest.questId);

    // Batch: remove quest + add XP + add items + notification
    store.completeQuest(questId);
    if (questDef?.xpReward) {
      store.addXp(questDef.xpReward);
    }
    if (questDef?.itemRewards) {
      for (const item of questDef.itemRewards) {
        store.addItem(item);
      }
    }
  }, []);

  /**
   * Level up skill tree node with effects
   */
  const unlockSkillWithEffects = useCallback((skillId: string) => {
    const store = useGameStore.getState();
    if (!store.canUnlockSkill(skillId)) return;

    store.unlockSkillTreeNode(skillId);
    // Additional effects handled by the slice
  }, []);

  return {
    restAndRecover,
    completeQuestWithRewards,
    unlockSkillWithEffects,
  };
}

/* ═══════════════════════════════════════════════════════════════
   Performance monitoring hook
   ═══════════════════════════════════════════════════════════════ */

/**
 * Hook to monitor store performance in development
 */
export function useStorePerformanceMonitor() {
  const renderCount = useRef(0);

  if (process.env.NODE_ENV === 'development') {
    renderCount.current++;

    if (renderCount.current % 100 === 0) {
      console.log(`[Store Performance] Component rendered ${renderCount.current} times`);
    }
  }
}
