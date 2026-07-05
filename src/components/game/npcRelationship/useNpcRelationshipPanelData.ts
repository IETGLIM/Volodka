import { useMemo } from 'react';
import { useGameStore } from '@/store/gameStore';
import { sortNpcRelationsByValue } from '@/engine/npcRelationship/npcRelationshipPresentation';
import { useGameSelector, useGamePrimitive } from '@/store/selectors/hooks';

/**
 * NPC relationship panel data hook.
 *
 * IMPORTANT: sortNpcRelationsByValue creates a new array every call. If called
 * inside useGameSelector, the new array reference causes useShallow to detect
 * a change every render → re-render → selector runs again → new array →
 * infinite loop (React error #185: Maximum update depth exceeded).
 *
 * Fix: subscribe to the raw npcRelations array via useGameSelector (stable
 * reference — only changes when the store actually updates), then sort in a
 * useMemo. The memoized sorted array is stable across renders when
 * npcRelations hasn't changed.
 */
export function useNpcRelationshipPanelData() {
  const npcRelations = useGameSelector((state) => state.npcRelations);
  const npcStates = useGameSelector((state) => state.exploration.npcStates);
  const currentHour = useGamePrimitive((state) => state.exploration.timeOfDay);
  const npcAffinity = useGameSelector((state) => state.npcAffinity);

  const sortedRelations = useMemo(
    () => sortNpcRelationsByValue(npcRelations),
    [npcRelations],
  );

  return { sortedRelations, npcStates, currentHour, npcAffinity };
}
