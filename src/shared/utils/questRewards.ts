import type { QuestDefinition, QuestType } from '@/shared/types/game';

const QUEST_TYPE_XP: Record<QuestType, number> = {
  main: 50,
  side: 25,
  hidden: 75,
  daily: 15,
};

/** Base XP granted on quest completion (in addition to explicit reward effects). */
export function getDefaultQuestXp(questType: QuestType): number {
  return QUEST_TYPE_XP[questType] ?? 25;
}

/** Base credits granted on quest completion (in addition to explicit reward effects). */
export function computeQuestCreditReward(questDef: QuestDefinition): number {
  const baseByType: Record<QuestType, number> = {
    main: 80,
    side: 40,
    hidden: 120,
    daily: 25,
  };
  const diffMult =
    questDef.difficulty === 'hard' ? 1.3 : questDef.difficulty === 'easy' ? 0.85 : 1;
  const base = baseByType[questDef.questType] ?? 35;
  const actBonus = (questDef.act ?? 1) * 8;
  return Math.max(10, Math.round(base * diffMult + actBonus));
}

/** Human-readable reward summary for quest completion notifications. */
export function formatQuestCompletionRewards(def: QuestDefinition): string {
  const parts: string[] = [];
  for (const r of def.rewards ?? []) {
    if (r.type === 'addKarma' && r.value) parts.push(`+${r.value} кармы`);
    if (r.type === 'addSkill' && r.skill && r.value) parts.push(`+${r.value} ${r.skill}`);
    if (r.type === 'addXp' && r.value) parts.push(`+${r.value} опыта`);
    if (r.type === 'addCredits' && r.value) parts.push(`+${r.value} кредитов`);
  }
  parts.push(`Опыт за задание +${getDefaultQuestXp(def.questType)}`);
  parts.push(`Кредиты +${computeQuestCreditReward(def)}`);
  return parts.join(', ');
}
