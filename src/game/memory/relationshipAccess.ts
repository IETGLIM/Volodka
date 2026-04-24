import { recalculateRelationship } from './RelationshipEngine';
import { useMemoryStore } from './memoryStore';

/** Кэш из `memoryStore.relationships` или пересчёт по текущим воспоминаниям. */
export function getRelationshipScore(entityId: string): number {
  const s = useMemoryStore.getState();
  const cached = s.relationships[entityId];
  if (cached !== undefined) return cached;
  return recalculateRelationship(entityId, s.memories);
}
