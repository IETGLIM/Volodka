/* ─── Volodka RPG – память HP крипов между встречами (v4.8.8) ───
 *
 * Второй инкремент бэклога «реал-тайм 3D-комбат» (приоритет C). После
 * ПОБЕГА игрока крип больше не «забывает» полученный урон: остаток HP
 * запоминается в реал-тайм реестре, и при следующей встрече враг вступает
 * в бой ослабленным. Сильно ослабленный крип (порог 35%) ДОБИВАЕТСЯ
 * опережающим ударом до пошагового боя — «из тени, без честной драки».
 *
 * Архитектура (паттерн meleeStrike.ts — модульный одиночка движка, без
 * стора и React):
 *   • пишет PatrollingCreeps: на combat:fled читает остаток HP врага из
 *     боевой сессии (getCombatState) и вызывает noteCreepWeakened;
 *   • читает meleeStrike.ts: при замахе решает — добивание или обычное
 *     вовлечение; PatrollingCreeps берёт introHpPct для новой встречи;
 *   • чистит meleeStrike.ts (после добивания), PatrollingCreeps (смена
 *     сцены) и сам реестр (регенерация по времени).
 *
 * Регенерация: крип полностью восстанавливается за CREEP_VITALITY_REGEN_MS
 * после ранения — бессрочные «полутрупы» у патруля ломали бы баланс
 * наград (добивание даёт урезанные XP/кредиты за обход последней фазы
 * боя). Пошаговый CombatSystem не тронут: HP живёт только вне боя.
 */

/** Доля HP крипа, ниже которой удар становится добиванием (≤ 0.35). */
export const MELEE_STRIKE_FINISHER_HP_PCT = 0.35;

/** Полная регенерация крипа после ранения (мс) — 90 секунд. */
export const CREEP_VITALITY_REGEN_MS = 90_000;

interface CreepVitalityEntry {
  /** Остаток HP последнего побега (0..1). */
  hpPct: number;
  /** Момент ранения (Date.now) — старт отсчёта регенерации. */
  weakenedAtMs: number;
}

const entries = new Map<string, CreepVitalityEntry>();

/**
 * Запоминает остаток HP крипа после побега игрока. Значения зажимаются в
 * 0..1; полные HP (≥ 1) снимают ослабление. Повторное ранение берёт
 * минимум (крип слабеет монотонно) и обновляет отсчёт регенерации.
 */
export function noteCreepWeakened(
  creepId: string,
  hpPct: number,
  nowMs: number = Date.now(),
): void {
  if (!Number.isFinite(hpPct)) return;
  const clamped = Math.max(0, Math.min(1, hpPct));
  if (clamped >= 1) {
    entries.delete(creepId);
    return;
  }
  const prev = entries.get(creepId);
  const stillFresh = prev !== undefined && nowMs - prev.weakenedAtMs <= CREEP_VITALITY_REGEN_MS;
  const nextPct = stillFresh ? Math.min(prev!.hpPct, clamped) : clamped;
  entries.set(creepId, { hpPct: nextPct, weakenedAtMs: nowMs });
}

/**
 * Остаток HP крипа (0..1) или null — крип здоров либо уже регенерировал.
 * Истёкшие записи удаляются лениво (без таймеров).
 */
export function getCreepWeakenedHpPct(
  creepId: string,
  nowMs: number = Date.now(),
): number | null {
  const entry = entries.get(creepId);
  if (!entry) return null;
  if (nowMs - entry.weakenedAtMs > CREEP_VITALITY_REGEN_MS) {
    entries.delete(creepId);
    return null;
  }
  return entry.hpPct;
}

/** Хватает ли остатка HP для добивания ударом до боя. */
export function isCreepFinishable(hpPct: number): boolean {
  return hpPct <= MELEE_STRIKE_FINISHER_HP_PCT;
}

/** Крип повержен/убит — снимаем ослабление (запись больше не нужна). */
export function clearCreepVitality(creepId: string): void {
  entries.delete(creepId);
}

/** Смена сцены — реестр крипов полностью устарел. */
export function clearAllCreepVitality(): void {
  entries.clear();
}

/** Сброс реестра для юнит-тестов. */
export function resetCreepVitalityForTests(): void {
  entries.clear();
}
