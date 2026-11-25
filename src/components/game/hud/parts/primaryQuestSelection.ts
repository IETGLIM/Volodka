import { GOLDEN_PATH_QUEST_SPINE } from '@/data/goldenPath';

export interface ActiveQuestIdentity {
  questId: string;
}

/**
 * Resolve the one quest shown in the persistent mobile HUD.
 *
 * Explicit player selection wins while that quest remains active. Otherwise,
 * the active golden-path quest is preferred over side/daily content so an
 * optional quest cannot silently replace the main story objective.
 */
export function resolvePrimaryTrackedQuest<T extends ActiveQuestIdentity>(
  activeQuests: readonly T[],
  pinnedQuestId: string | null,
): T | null {
  if (pinnedQuestId) {
    const pinned = activeQuests.find((quest) => quest.questId === pinnedQuestId);
    if (pinned) return pinned;
  }

  return (
    activeQuests.find((quest) => GOLDEN_PATH_QUEST_SPINE.includes(quest.questId)) ??
    activeQuests[0] ??
    null
  );
}
