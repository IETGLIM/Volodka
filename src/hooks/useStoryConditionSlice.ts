'use client';

import { useShallow } from 'zustand/react/shallow';
import { useGameStore } from '@/state';

/**
 * Плоский срез полей игрока для проверки условий выборов (statsEngine / диалог).
 * useShallow — ререндер только когда меняется одно из перечисленных полей.
 */
export function useStoryConditionSlice() {
  return useGameStore(
    useShallow((s) => {
      const p = s.playerState;
      return {
        mood: p.mood,
        creativity: p.creativity,
        stability: p.stability,
        energy: p.energy,
        karma: p.karma,
        selfEsteem: p.selfEsteem,
        stress: p.stress,
        panicMode: p.panicMode,
        skills: p.skills,
        flags: p.flags,
        visitedNodes: p.visitedNodes,
      };
    }),
  );
}
