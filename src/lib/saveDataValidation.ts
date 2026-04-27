/**
 * Предварительная проверка сырого JSON сейва до `normalizeLoadedState` в `gameStore`
 * (не полная Zod-схема — только защита от мусора и пустого `{}` после parse).
 */
export function isValidSaveDataShape(data: unknown): boolean {
  if (data == null || typeof data !== 'object' || Array.isArray(data)) return false;
  const o = data as Record<string, unknown>;
  if (o.playerState != null && typeof o.playerState === 'object' && !Array.isArray(o.playerState)) {
    return true;
  }
  if (typeof o.currentNodeId === 'string' && o.currentNodeId.length > 0) {
    return true;
  }
  if (o.exploration != null && typeof o.exploration === 'object' && !Array.isArray(o.exploration)) {
    return true;
  }
  if (Array.isArray(o.activeQuestIds)) {
    return true;
  }
  if (Array.isArray(o.inventory)) {
    return true;
  }
  if (Array.isArray(o.collectedPoemIds)) {
    return true;
  }
  if (o.questProgress != null && typeof o.questProgress === 'object' && !Array.isArray(o.questProgress)) {
    return true;
  }
  if (o.factionReputations != null && typeof o.factionReputations === 'object' && !Array.isArray(o.factionReputations)) {
    return true;
  }
  return false;
}
