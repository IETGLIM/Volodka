/* ─── Volodka RPG – реестр живых позиций крипов для HUD (v4.15.2) ───
 *
 * Фича «враги на миникарте» (WoW/GTA-стиль, п.4E ТЗ). Раньше миникарта
 * показывала только NPC по репутации — патрулирующие крипы (PatrollingCreeps)
 * были невидимы, и игрок натыкался на агро-конусы вслепую.
 *
 * Архитектура (паттерн creepVitality.ts / meleeStrike.ts — модульный
 * одиночка движка, без стора и React):
 *   • пишет PatrollingCreeps: один map.set за кадр на крипа в его
 *     существующем useFrameTick('npc') — дёшево, без ре-рендеров;
 *   • читает MinimapComponent: в rAF-цикле отрисовки (forEachCreepInScene,
 *     без промежуточных аллокаций);
 *   • чистит PatrollingCreeps (unmount/смена сцены — крипы монтируются
 *     по сценам) и engineRuntimeReset (полный teardown сессии).
 *
 * Состояние крипа влияет на цвет маркера: патруль — приглушённый красный,
 * погоня/бой — яркий красный с агро-пульсом, возврат/передышка — серо-красный.
 */

import type { SceneId } from '@/shared/types/game';

/** Поведенческое состояние крипа в момент отчёта (совпадает с stateRef PatrollingCreeps). */
export type CreepPresenceState =
  | 'patrol'
  | 'chase'
  | 'engaged'
  | 'return'
  | 'cooldown';

export interface CreepPresenceEntry {
  creepId: string;
  sceneId: SceneId;
  /** Мировая X — та же координатная сетка, что у NPC-точек миникарты. */
  x: number;
  /** Мировая Z. */
  z: number;
  state: CreepPresenceState;
}

interface CreepPresenceRecord {
  x: number;
  z: number;
  state: CreepPresenceState;
}

/** sceneId → creepId → живая позиция (плоская карта, без вложенных проходов в кадре). */
const presenceByScene = new Map<SceneId, Map<string, CreepPresenceRecord>>();

/** Отчёт из кадрового тика крипа. Дёшево: один map.set, ноль аллокаций при повторе. */
export function reportCreepPresence(
  creepId: string,
  sceneId: SceneId,
  x: number,
  z: number,
  state: CreepPresenceState,
): void {
  let sceneMap = presenceByScene.get(sceneId);
  if (!sceneMap) {
    sceneMap = new Map();
    presenceByScene.set(sceneId, sceneMap);
  }
  const existing = sceneMap.get(creepId);
  if (existing) {
    existing.x = x;
    existing.z = z;
    existing.state = state;
  } else {
    sceneMap.set(creepId, { x, z, state });
  }
}

/** Крип размонтирован/деспавнен — убрать с миникарты. */
export function removeCreepPresence(creepId: string, sceneId: SceneId): void {
  presenceByScene.get(sceneId)?.delete(creepId);
}

/** Итерация по крипам СЦЕНЫ без аллокаций (для rAF-цикла миникарты). */
export function forEachCreepInScene(
  sceneId: SceneId,
  visitor: (entry: CreepPresenceEntry) => void,
): void {
  const sceneMap = presenceByScene.get(sceneId);
  if (!sceneMap) return;
  for (const [creepId, rec] of sceneMap) {
    visitor({ creepId, sceneId, x: rec.x, z: rec.z, state: rec.state });
  }
}

/** Полный сброс реестра (teardown сессии / New Game). Идемпотентен. */
export function clearCreepPresenceRegistry(): void {
  presenceByScene.clear();
}

/** Тестовый/диагностический размер реестра. */
export function getCreepPresenceCount(): number {
  let total = 0;
  for (const sceneMap of presenceByScene.values()) total += sceneMap.size;
  return total;
}
