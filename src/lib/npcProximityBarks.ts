/**
 * Короткие оклики NPC при входе игрока в радиус (без нажатия E).
 * Отношение — `NPCRelation.value` (−100…100): низкое / высокое задаёт реплику.
 */
export const NPC_BARK_RADIUS_XZ = 3.6;
export const NPC_BARK_COOLDOWN_MS = 22_000;

export function distanceXZ(
  a: { x: number; z: number },
  b: { x: number; z: number },
): number {
  const dx = a.x - b.x;
  const dz = a.z - b.z;
  return Math.hypot(dx, dz);
}

/** Текст тоста с подписью персонажа. */
export function npcProximityBarkText(npcName: string, relationValue: number): string {
  if (relationValue <= 35) {
    return `${npcName}: Опять ты, Володька? Проваливай!`;
  }
  if (relationValue >= 65) {
    return `${npcName}: Привет, герой!`;
  }
  return `${npcName}: Эй, Володька…`;
}

export function relationValueForNpc(
  npcId: string,
  relations: ReadonlyArray<{ id: string; value: number }>,
): number {
  const r = relations.find((x) => x.id === npcId);
  return r?.value ?? 0;
}
