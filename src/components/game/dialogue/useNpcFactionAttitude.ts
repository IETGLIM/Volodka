/* ─── Volodka RPG – hook: отношение фракции говорящего NPC (v4.8.6) ───
 *
 * Мост между агрегатором репутации фракций (store/selectors — компонентный
 * слой, движок стор не импортирует) и чистой презентацией в shared
 * (npcFactionAttitude). Возвращает единую «карточку отношения» для чипа
 * в шапке диалога и реплики-флейвор.
 *
 * Если у NPC нет фракции — null (чип не рисуется, реплика не добавляется).
 */

import { useMemo } from 'react';
import { ALL_NPC_DEFINITIONS } from '@/data/allNpcDefinitions';
import {
  normalizeFactionId,
  FACTION_LABELS_RU,
  useFactionReputation,
  type FactionId,
} from '@/store/selectors/factionReputationSelectors';
import {
  factionAttitudeLine,
  resolveFactionAttitudeTier,
  FACTION_ATTITUDE_TIER_LABELS,
  type FactionAttitudeTier,
} from '@/shared/npcFactionAttitude';

export interface NpcFactionAttitude {
  readonly factionId: FactionId;
  readonly factionLabel: string;
  readonly tier: FactionAttitudeTier;
  /** Русская подпись уровня («Союзник», «Настороженно», …). */
  readonly tierLabel: string;
  /** Реплика-флейвор (null у нейтрального уровня). */
  readonly line: string | null;
  /** Сколько членов фракции знакомы игроку (для подсказки в тултипе). */
  readonly metCount: number;
}

export function useNpcFactionAttitude(npcId: string): NpcFactionAttitude | null {
  const reputation = useFactionReputation();

  return useMemo(() => {
    if (!npcId) return null;
    const npc = ALL_NPC_DEFINITIONS.find((n) => n.id === npcId);
    if (!npc?.faction) return null;
    const factionId = normalizeFactionId(npc.faction);
    const entry = reputation[factionId];
    if (!entry) return null;
    const tier = resolveFactionAttitudeTier(entry.avgRelation);
    const factionLabel = FACTION_LABELS_RU[factionId];
    return {
      factionId,
      factionLabel,
      tier,
      tierLabel: FACTION_ATTITUDE_TIER_LABELS[tier],
      line: factionAttitudeLine(tier, factionLabel),
      metCount: entry.metCount,
    } satisfies NpcFactionAttitude;
  }, [npcId, reputation]);
}
