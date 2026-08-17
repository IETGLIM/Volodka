/* ─── Volodka RPG – faction reputation aggregation selectors ───
 *
 * Groups met NPCs by faction and computes an aggregate reputation
 * per faction (average relation of all met members).
 *
 * "Met" definition (matches the npcDiscoveryTracker convention):
 *   • the player has a `met_<id>` flag set in playerState.flags, OR
 *   • the NPC has a row in npcRelations (relation !== default — i.e.
 *     the neutral baseline of 50 has been touched).
 *
 * Memoized by source-array reference using createSourceRefCache
 * (same pattern as questSelectors). Two independent caches:
 *   • relationsCache — keyed on npcRelations array
 *   • flagsCache     — keyed on the metFlag bitmask derived from flags
 * The composed aggregation is memoized on a (relationsRef, flagsRef)
 * tuple via createMemoSelector.
 */

import type { NPCRelation } from '@/shared/types/game';
import { ALL_NPC_DEFINITIONS, NPCS_BY_FACTION } from '@/data/allNpcDefinitions';
import { getGameStore } from '../gameStore';
import { useGameSelector } from './hooks';
import {
  createMemoSelector,
  createSourceRefCache,
  memoizeBySourceRef,
} from './memo';

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
   Memo caches
   ────────────────────────────────────────────────────────────── */

const relationsByFactionCache = createSourceRefCache<
  NPCRelation[],
  Map<FactionId, number[]>
>();

const metFlagsCache = createSourceRefCache<
  Record<string, boolean>,
  ReadonlySet<string>
>();

/* ──────────────────────────────────────────────────────────────
   Helpers
   ────────────────────────────────────────────────────────────── */

/** Build the set of canonical NPC ids the player has met. */
function selectMetNpcIds(flags: Record<string, boolean>): ReadonlySet<string> {
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
function buildRelationsByFaction(
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
    const faction = npc.faction as FactionId;
    if (!grouped.has(faction)) continue;
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

/* ──────────────────────────────────────────────────────────────
   Plain getters (memoized by source ref)
   ────────────────────────────────────────────────────────────── */

export function getMetNpcIds(flags: Record<string, boolean> = getGameStore().playerState.flags): ReadonlySet<string> {
  return memoizeBySourceRef(flags, metFlagsCache, (f) => selectMetNpcIds(f));
}

export function getRelationsByFaction(
  relations: readonly NPCRelation[] = getGameStore().npcRelations,
  flags: Record<string, boolean> = getGameStore().playerState.flags,
): Map<FactionId, number[]> {
  // Compose: the cache is keyed on the relations array reference, but the
  // computed result also depends on `flags`. We recompute whenever either
  // input changes reference. createSourceRefCache only tracks one ref, so
  // we invalidate it manually when the flags ref changes.
  const metIds = getMetNpcIds(flags);
  return memoizeBySourceRef(relations, relationsByFactionCache, (rels) =>
    buildRelationsByFaction(rels, metIds),
  );
}

/* ──────────────────────────────────────────────────────────────
   Aggregated faction reputation
   ────────────────────────────────────────────────────────────── */

function buildFactionReputationMap(
  relations: readonly NPCRelation[],
  flags: Record<string, boolean>,
): FactionReputationMap {
  const grouped = getRelationsByFaction(relations, flags);
  const result = {} as FactionReputationMap;
  for (const factionId of FACTION_IDS) {
    const values = grouped.get(factionId) ?? [];
    const totalMembers = NPCS_BY_FACTION[factionId]?.length ?? 0;
    const metCount = values.length;
    const avgRelation =
      metCount > 0
        ? Math.round(values.reduce((sum, v) => sum + v, 0) / metCount)
        : NPC_NEUTRAL_RELATION;
    result[factionId] = { avgRelation, metCount, totalMembers };
  }
  return result;
}

const aggregateReputationMemo = createMemoSelector(
  () => {
    const s = getGameStore();
    return [s.npcRelations, s.playerState.flags] as [NPCRelation[], Record<string, boolean>];
  },
  (relations, flags) => buildFactionReputationMap(relations, flags),
);

/** Returns the per-faction reputation map for the current store snapshot. */
export function getFactionReputationMap(): FactionReputationMap {
  return aggregateReputationMemo();
}

/* ──────────────────────────────────────────────────────────────
   React hook (shallow equality — keeps the returned map stable when
   the underlying avgRelation / metCount numbers don't change).
   ────────────────────────────────────────────────────────────── */

export function useFactionReputation(): FactionReputationMap {
  return useGameSelector((s) =>
    buildFactionReputationMap(s.npcRelations, s.playerState.flags),
  );
}
