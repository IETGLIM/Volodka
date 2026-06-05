
/* ─── Volodka RPG – derived quest store for UI (AAA+ Overhaul) ─── */
/* Re-exports memoized selectors from @/store/selectors/questSelectors. */

export {
  getActiveQuests,
  getFailedQuests,
  getQuestsByType,
  getQuestProgress,
  areDependenciesMet,
  getQuestMarker,
  getNextTrackedObjective,
  getQuestIndicatorForNpc,
  useActiveQuests,
  useFailedQuests,
  useNextTrackedObjective,
  useQuestIndicatorForNpc,
  type QuestIndicatorType,
} from './selectors/questSelectors';
