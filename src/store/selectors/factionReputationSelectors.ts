/* ─── Volodka RPG – faction reputation aggregation selectors ───
 *
 * Store-слой над ЧИСТОЙ группировкой фракций (factionGrouping.ts — без
 * импортов gameStore/сторов): мемоизация по source-ref, агрегированная
 * карта репутации и React-хук. Чистая часть вынесена в v4.8.8, чтобы
 * слайсы/crossSliceReads могли считать фракционную репутацию без ребра
 * «слайсы → селекторы → gameStore» (цикл оценки модулей).
 *
 * "Met" definition (matches the npcDiscoveryTracker convention):
 *   • the player has a `met_<id>` flag set in playerState.flags, OR
 *   • the NPC has a row in npcRelations (relation !== default — i.e.
 *     the neutral baseline of 50 has been touched).
 */

import type { NPCRelation } from '@/shared/types/game';
import { getGameStore } from '../gameStore';
import { useGameSelector } from './hooks';
import {
  createMemoSelector,
  createSourceRefCache,
  memoizeBySourceRef,
} from './memo';
import {
  buildFactionReputationMap,
  buildRelationsByFaction,
  selectMetNpcIds,
} from './factionGrouping';

/* ─── Re-exports of the pure layer (public API unchanged) ─── */
export {
  NPC_NEUTRAL_RELATION,
  FACTION_IDS,
  FACTION_LABELS_RU,
  FACTION_ALIASES,
  normalizeFactionId,
} from './factionGrouping';
export type { FactionId, FactionReputationEntry, FactionReputationMap } from './factionGrouping';
export { buildFactionReputationMapFrom } from './factionGrouping';
import type {
  FactionId,
  FactionReputationMap,
} from './factionGrouping';

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
