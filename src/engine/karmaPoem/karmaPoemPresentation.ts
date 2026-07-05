import { ALL_ENDINGS } from '@/data/goldenPath';
import {
  countCollectedHiddenPoems,
  countCollectedMainPoems,
  hasAllMainPoems,
  TOTAL_MAIN_POEMS,
  TOTAL_UNIFIED_POEMS,
} from '@/data/poemCollectionMeta';
import { getAllUnifiedPoems, getUnifiedPoem } from '@/data/unifiedPoemRegistry';
import { QUEST_DEFINITIONS } from '@/data/quests';
import { getPoemPower } from '@/engine/PoemPowerSystem';
import type { PlayerSkills } from '@/shared/types/game';

export type KarmaPoemTab = 'karma' | 'poems';

export type EndingView = {
  id: string;
  title: string;
  description: string;
  condition: string;
  available: boolean;
};

export type PoemSlotView = {
  id: string;
  index: number;
  collected: boolean;
  title: string;
};

export type KarmaPoemPanelInput = {
  karma: number;
  collectedPoems: readonly string[];
  notifications: ReadonlyArray<{ id: string; type: string; text: string; timestamp: number }>;
  poemPowers: Record<string, { lastUsed: number; cooldownMs: number }>;
  skills: PlayerSkills;
  flags: Record<string, boolean>;
};

export function isKarmaPoemPanelDataReady(): boolean {
  return ALL_ENDINGS.length > 0 && TOTAL_UNIFIED_POEMS > 0;
}

export function evaluateEndingAvailability(
  karma: number,
  collectedPoems: readonly string[],
  skills: PlayerSkills,
  flags: Record<string, boolean>,
): EndingView[] {
  return ALL_ENDINGS.map((ending) => ({
    ...ending,
    available: isEndingCurrentlyAvailable(ending.id, karma, collectedPoems, skills, flags),
  }));
}

export function isEndingCurrentlyAvailable(
  endingId: string,
  karma: number,
  collectedPoems: readonly string[],
  skills: PlayerSkills,
  flags: Record<string, boolean>,
): boolean {
  switch (endingId) {
    case 'ending_creator':
      return karma >= 60 && skills.writing >= 7;
    case 'ending_rebel':
      return karma >= 60 && skills.persuasion >= 7;
    case 'ending_exile':
      return karma < 40;
    case 'ending_machine':
      return skills.coding >= 8 && flags.low_empathy === true;
    case 'ending_poet':
      return hasAllMainPoems(collectedPoems);
    default:
      return false;
  }
}

export function buildRecentKarmaChanges(
  notifications: KarmaPoemPanelInput['notifications'],
): KarmaPoemPanelInput['notifications'] {
  return notifications.filter((entry) => entry.type === 'karma').slice(-5);
}

export function buildPoemSlots(collectedPoems: readonly string[]): PoemSlotView[] {
  return getAllUnifiedPoems().map((poem, index) => ({
    id: poem.id,
    index: index + 1,
    collected: collectedPoems.includes(poem.id),
    title: poem.poemTitle || poem.canonicalName,
  }));
}

export function countReadyPoemPowers(
  collectedPoems: readonly string[],
  poemPowers: Record<string, { lastUsed: number; cooldownMs: number }>,
  now: number = Date.now(),
): number {
  return collectedPoems.filter((poemId) => {
    if (!getPoemPower(poemId)) return false;
    const powerState = poemPowers[poemId];
    if (!powerState) return true;
    return now - powerState.lastUsed >= powerState.cooldownMs;
  }).length;
}

export function countPoemsWithPowers(collectedPoems: readonly string[]): number {
  return collectedPoems.filter((poemId) => !!getPoemPower(poemId)).length;
}

export function buildPoemBypassQuests(): Array<{ id: string; title: string }> {
  return QUEST_DEFINITIONS.filter((quest) =>
    quest.objectives.some((objective) => objective.poemPowerBypass),
  ).map((quest) => ({ id: quest.id, title: quest.title }));
}

export function buildKarmaPoemPanelView(input: KarmaPoemPanelInput) {
  const mainCollectedCount = countCollectedMainPoems(input.collectedPoems);
  const bonusCollectedCount = countCollectedHiddenPoems(input.collectedPoems);

  return {
    dataReady: isKarmaPoemPanelDataReady(),
    karma: input.karma,
    availableEndings: evaluateEndingAvailability(
      input.karma,
      input.collectedPoems,
      input.skills,
      input.flags,
    ),
    recentKarmaChanges: buildRecentKarmaChanges(input.notifications),
    poemSlots: buildPoemSlots(input.collectedPoems),
    /** Сюжетные стихи Владимира (poem_1–poem_21) — для концовки «Поэт». */
    collectedCount: mainCollectedCount,
    totalPoems: TOTAL_MAIN_POEMS,
    /** Бонусные/скрытые стихи — для 100% completion. */
    bonusCollectedCount,
    totalBonusPoems: TOTAL_UNIFIED_POEMS - TOTAL_MAIN_POEMS,
    totalUnifiedPoems: TOTAL_UNIFIED_POEMS,
    readyPowerCount: countReadyPoemPowers(input.collectedPoems, input.poemPowers),
    powerPoemCount: countPoemsWithPowers(input.collectedPoems),
    poemBypassQuests: buildPoemBypassQuests(),
    getPoemTitle: (poemId: string) => getUnifiedPoem(poemId)?.poemTitle ?? poemId,
  };
}

export type KarmaPoemPanelView = ReturnType<typeof buildKarmaPoemPanelView>;
