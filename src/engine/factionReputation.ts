/**
 * Движок репутации фракций
 * Управляет изменением репутации, проверками доступности квестов
 */

import type { FactionId } from '@/shared/types/definitions/faction';
import {
  FACTION_DEFINITIONS,
  getFactionTitle,
} from '@/shared/types/definitions/faction';

/** Текущая репутация по фракциям */
const factionReputation: Record<FactionId, number> = {
  streltsy: 0,
  tolpa: 0,
  merchant_guild: 0,
  underground: 0,
  forest_folk: 0,
};

/** Кэш функций-слушателей */
const listeners = new Set<() => void>();

/** Подписка на изменения репутации */
export function onFactionReputationChange(fn: () => void): () => void {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

function notifyListeners() {
  for (const fn of listeners) fn();
}

/** Изменить репутацию с клэмпингом [-100, 100] */
export function addReputation(factionId: FactionId, amount: number): number {
  const clamped = Math.max(-100, Math.min(100, factionReputation[factionId] + amount));
  factionReputation[factionId] = clamped;
  notifyListeners();
  return clamped;
}

/** Получить текущий уровень репутации */
export function getReputation(factionId: FactionId): number {
  return factionReputation[factionId];
}

/** Получить все уровни репутации */
export function getAllReputations(): Record<FactionId, number> {
  return { ...factionReputation };
}

/** Получить заголовок репутации на русском */
export function getFactionReputationTitle(factionId: FactionId): string {
  return getFactionTitle(factionReputation[factionId]);
}

/** Получить определение фракции */
export function getFactionDef(factionId: FactionId) {
  return FACTION_DEFINITIONS[factionId];
}

/** Проверить, доступен ли квест для данной фракции */
export function isQuestAvailableForFaction(
  questFaction: FactionId | undefined,
  minReputation: number = 0,
): boolean {
  if (!questFaction) return true;
  const def = FACTION_DEFINITIONS[questFaction];
  if (!def) return true;
  return factionReputation[questFaction] >= (minReputation || def.questAccessThreshold);
}

/** Рассчитать модификатор цены торговли (репутация влияет на скидку) */
export function getPriceModifier(factionId: FactionId): number {
  const rep = factionReputation[factionId];
  const def = FACTION_DEFINITIONS[factionId];
  // Каждый пункт репутации даёт baseDiscount * 0.01 скидки
  return 1 - (rep * def.baseDiscount * 0.01);
}

/** Сбросить репутацию (для отладки или нового начала) */
export function resetReputation(factionId?: FactionId): void {
  if (factionId) {
    factionReputation[factionId] = 0;
  } else {
    for (const key of Object.keys(factionReputation) as FactionId[]) {
      factionReputation[key] = 0;
    }
  }
  notifyListeners();
}
