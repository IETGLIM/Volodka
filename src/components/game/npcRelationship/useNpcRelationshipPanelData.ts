import { useGameSelector } from '@/store/selectors/hooks';
import { sortNpcRelationsByValue } from '@/engine/npcRelationship/npcRelationshipPresentation';

export function useNpcRelationshipPanelData() {
  return useGameSelector((state) => ({
    sortedRelations: sortNpcRelationsByValue(state.npcRelations),
    npcStates: state.exploration.npcStates,
    currentHour: state.exploration.timeOfDay,
    npcAffinity: state.npcAffinity,
  }));
}
