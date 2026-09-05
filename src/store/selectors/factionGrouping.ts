/* ─── Volodka RPG – чистая группировка NPC по фракциям ───
 *
 * Только данные и чистые функции: без импортов gameStore/сторов — модуль
 * безопасно импортировать из ЛЮБОГО слоя (слайсы, crossSliceReads,
 * компоненты), не создавая циклов инициализации стора. Раньше группировка
 * жила в factionReputationSelectors, который тянет gameStore — появление
 * ребра «слайсы → селекторы» в v4.8.8 ломало порядок оценки модулей при
 * входе в граф через slice-стор.
 *
 * «Знакомство» (конвенция npcDiscoveryTracker):
 *   • флаг met_<id> в playerState.flags, ИЛИ
 *   • строка в npcRelations (значение может быть нейтральной базой 50).
 * Знакомый без строки отношения входит в среднее с базой 50.
 */

import type { NPCRelation } from '@/shared/types/game';
import { ALL_NPC_DEFINITIONS } from '@/data/allNpcDefinitions';

/** Neutral baseline — matches worldSlice.setNpcRelation's starting value. */
export const NPC_NEUTRAL_RELATION = 50;

/** Canonical faction ids present on NPCDefinition.faction in the merged registry. */
export const FACTION_IDS = ['network', 'guild', 'resistance', 'neutral', 'tolpa'] as const;
export type FactionId = (typeof FACTION_IDS)[number];

/** Russian display labels for each faction (visible in the UI). */
export const FACTION_LABELS_RU: Record<FactionId, string> = {
  network: 'Сеть',
  guild: 'Гильдия',
  resistance: 'Сопротивление',
  neutral: 'Нейтральные',
  tolpa: 'ТОЛПА',
};

/* ─── Faction aliases (v4.7.2 consolidation) ───
 *
 * Historically two faction vocabularies coexisted: the live canonical set
 * above and a legacy set (streltsy / merchant_guild / underground /
 * forest_folk) from engine/factionReputation.ts (dead module — removed),
 * plus `it_guild` from early act-1 quests. Content written against the
 * legacy ids silently dropped out of reputation aggregation (an NPC with
 * faction 'merchant_guild' matched no canonical group → skipped), so 20+
 * NPCs never counted toward any faction. normalizeFactionId() maps the
 * legacy ids onto their closest canonical counterparts:
 *   • streltsy (городская стража)      → guild — Гильдия порядка
 *   • merchant_guild (торговая гильдия) → guild — торговое крыло Гильдии
 *   • it_guild (IT-гильдия офиса)       → guild — офисные работники Гильдии
 *   • underground (подполье)            → resistance — теневое крыло Сопротивления
 *   • forest_folk (лесной народ)        → tolpa — чк-лес живёт в ТОЛПЕ
 */
export const FACTION_ALIASES: Readonly<Record<string, FactionId>> = {
  streltsy: 'guild',
  merchant_guild: 'guild',
  it_guild: 'guild',
  underground: 'resistance',
  forest_folk: 'tolpa',
};

/** Map any content faction id onto a canonical one (unknown ids → neutral). */
export function normalizeFactionId(raw: string): FactionId {
  return FACTION_ALIASES[raw] ?? (FACTION_IDS as readonly string[]).includes(raw)
    ? (FACTION_ALIASES[raw] ?? (raw as FactionId))
    : 'neutral';
}

export interface FactionReputationEntry {
  /** Average relation across met NPCs in this faction (0–100). */
  readonly avgRelation: number;
  /** Number of NPCs in this faction the player has met. */
  readonly metCount: number;
  /** Total NPC count in this faction (constant for a given build). */
  readonly totalMembers: number;
}

export type FactionReputationMap = Record<FactionId, FactionReputationEntry>;

/* ──────────────────────────────────────────────────────────────
   Pure grouping (no store access)
   ────────────────────────────────────────────────────────────── */

/** Build the set of canonical NPC ids the player has met. */
export function selectMetNpcIds(flags: Record<string, boolean>): ReadonlySet<string> {
  const result = new Set<string>();
  for (const npc of ALL_NPC_DEFINITIONS) {
    if (flags[`met_${npc.id}`]) {
      result.add(npc.id);
    }
  }
  return result;
}

/**
 * Build a Map<FactionId, number[]> of relation values for *met* NPCs only.
 * NPCs without a relation row default to NPC_NEUTRAL_RELATION (50), matching
 * worldSlice semantics.
 */
export function buildRelationsByFaction(
  relations: readonly NPCRelation[],
  metIds: ReadonlySet<string>,
): Map<FactionId, number[]> {
  const relationByNpcId = new Map<string, number>();
  for (const rel of relations) {
    relationByNpcId.set(rel.npcId, rel.value);
  }

  const grouped = new Map<FactionId, number[]>();
  for (const factionId of FACTION_IDS) {
    grouped.set(factionId, []);
  }

  for (const npc of ALL_NPC_DEFINITIONS) {
    if (!npc.faction) continue;
    // Legacy ids (merchant_guild / streltsy / underground / it_guild / …)
    // normalize onto canonical factions — see FACTION_ALIASES above.
    const faction = normalizeFactionId(npc.faction);
    // An NPC is "met" if either the met_<id> flag is set OR the NPC has a
    // relation row (relation !== default — i.e. the baseline has been
    // touched). This mirrors npcDiscoveryTracker.ts.
    const hasRelationRow = relationByNpcId.has(npc.id);
    if (!metIds.has(npc.id) && !hasRelationRow) continue;
    const value = relationByNpcId.get(npc.id) ?? NPC_NEUTRAL_RELATION;
    grouped.get(faction)!.push(value);
  }

  return grouped;
}

/**
 * Пересчитывает карту репутации по ЯВНЫМ данным: для синхронных
 * движковых/слайсовых чтений, где combined-кэш стора мог бы отстать
 * (он обновляется микротаской). Та же группировка, что в
 * useFactionReputation — данные передаются живые
 * (world.npcRelations + player.flags).
 */
export function buildFactionReputationMap(
  relations: readonly NPCRelation[],
  flags: Record<string, boolean>,
): FactionReputationMap {
  const metIds = selectMetNpcIds(flags);
  const grouped = buildRelationsByFaction(relations, metIds);
  const result = {} as FactionReputationMap;
  for (const factionId of FACTION_IDS) {
    const values = grouped.get(factionId) ?? [];
    // totalMembers: count members through the SAME normalization as the
    // grouping above, so legacy-id NPCs are included in their canonical
    // faction's totals.
    const totalMembers = ALL_NPC_DEFINITIONS.filter(
      (n) => n.faction && normalizeFactionId(n.faction) === factionId,
    ).length;
    const metCount = values.length;
    const avgRelation =
      metCount > 0
        ? Math.round(values.reduce((sum, v) => sum + v, 0) / metCount)
        : NPC_NEUTRAL_RELATION;
    result[factionId] = { avgRelation, metCount, totalMembers };
  }
  return result;
}

/** Алиас с явным названием источника данных (см. комментарий выше). */
export function buildFactionReputationMapFrom(
  relations: readonly NPCRelation[],
  flags: Record<string, boolean>,
): FactionReputationMap {
  return buildFactionReputationMap(relations, flags);
}
