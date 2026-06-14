/* ─── Volodka RPG – stats / progression panel selectors ─── */

import { useGameSelector } from './hooks';

/** CharacterProfilePanel — one subscription while panel is open. */
export function useCharacterProfilePanelState() {
  return useGameSelector((s) => ({
    karma: s.playerState.karma,
    energy: s.playerState.energy,
    stress: s.playerState.stress,
    skills: s.playerState.skills,
    equippedItems: s.playerState.equippedItems,
    credits: s.playerState.credits,
    visitedNodes: s.playerState.visitedNodes,
    progression: s.playerState.progression,
    inventory: s.playerState.inventory,
    npcRelations: s.npcRelations,
    collectedPoems: s.collectedPoems,
    quests: s.quests,
    timeOfDay: s.exploration.timeOfDay,
  }));
}

/** LevelUpSummary — snapshot fields for level-up diff. */
export function useLevelUpSummaryState() {
  return useGameSelector((s) => ({
    skills: s.playerState.skills,
    karma: s.playerState.karma,
    progression: s.playerState.progression,
  }));
}

/** PerksPanel — progression + perk actions. */
export function usePerksPanelState() {
  return useGameSelector((s) => ({
    progression: s.playerState.progression,
    acquirePerk: s.acquirePerk,
    canAcquirePerk: s.canAcquirePerk,
  }));
}

/** SkillTreePanel — progression + unlock actions. */
export function useSkillTreePanelState() {
  return useGameSelector((s) => ({
    progression: s.playerState.progression,
    unlockSkillTreeNode: s.unlockSkillTreeNode,
    canUnlockSkill: s.canUnlockSkill,
  }));
}

/** CraftingPanel — inventory, skills, craft actions. */
export function useCraftingPanelState() {
  return useGameSelector((s) => ({
    inventory: s.playerState.inventory,
    skills: s.playerState.skills,
    craftItem: s.craftItem,
    canCraft: s.canCraft,
  }));
}

/** @deprecated Prefer useQuestBoardSelectors + useQuestBoardController. */
export function useQuestBoardPanelState() {
  return useGameSelector((s) => ({
    acceptedDailyMissions: s.acceptedDailyMissions,
    acceptDailyMission: s.acceptDailyMission,
    abandonDailyMission: s.abandonDailyMission,
    claimDailyMissionReward: s.claimDailyMissionReward,
    playerLevel: s.playerState.progression.level,
  }));
}
