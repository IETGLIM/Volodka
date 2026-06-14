import { ALL_ENDINGS } from '@/data/goldenPath';
import { getAllUnifiedPoems, getUnifiedPoem, TOTAL_UNIFIED_POEMS } from '@/data/unifiedPoemRegistry';
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
  collectedPoemCount: number,
  skills: PlayerSkills,
  flags: Record<string, boolean>,
  totalPoems: number = TOTAL_UNIFIED_POEMS,
): EndingView[] {
  return ALL_ENDINGS.map((ending) => ({
    ...ending,
    available: isEndingCurrentlyAvailable(ending.id, karma, collectedPoemCount, skills, flags, totalPoems),
  }));
}

export function isEndingCurrentlyAvailable(
  endingId: string,
  karma: number,
  collectedPoemCount: number,
  skills: PlayerSkills,
  flags: Record<string, boolean>,
  totalPoems: number,
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
      return collectedPoemCount >= totalPoems;
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
  const totalPoems = TOTAL_UNIFIED_POEMS;
  return {
    dataReady: isKarmaPoemPanelDataReady(),
    karma: input.karma,
    availableEndings: evaluateEndingAvailability(
      input.karma,
      input.collectedPoems.length,
      input.skills,
      input.flags,
      totalPoems,
    ),
    recentKarmaChanges: buildRecentKarmaChanges(input.notifications),
    poemSlots: buildPoemSlots(input.collectedPoems),
    collectedCount: input.collectedPoems.length,
    totalPoems,
    readyPowerCount: countReadyPoemPowers(input.collectedPoems, input.poemPowers),
    powerPoemCount: countPoemsWithPowers(input.collectedPoems),
    poemBypassQuests: buildPoemBypassQuests(),
    getPoemTitle: (poemId: string) => getUnifiedPoem(poemId)?.poemTitle ?? poemId,
  };
}

export type KarmaPoemPanelView = ReturnType<typeof buildKarmaPoemPanelView>;
