import type { PlayerSkills, TrainablePlayerSkill } from '@/shared/types/game';
import type { LevelUpEvent } from '@/store/levelUpHelpers';
import {
  formatPerkPointsLabel,
  formatSkillPointsLabel,
} from '@/engine/levelUp/levelUpPresentation';

export type LevelUpSummaryData = LevelUpEvent & { id: string };

export type StatChange = {
  label: string;
  icon: string;
  before: number;
  after: number;
  delta: number;
};

export const SKILL_LABELS: Record<TrainablePlayerSkill, string> = {
  logic: 'Логика',
  coding: 'Кодирование',
  empathy: 'Эмпатия',
  persuasion: 'Убеждение',
  intuition: 'Интуиция',
  writing: 'Письмо',
  rhythm: 'Ритм',
};

export const SKILL_ICONS: Record<TrainablePlayerSkill, string> = {
  logic: '🧠',
  coding: '💻',
  empathy: '💛',
  persuasion: '🗣️',
  intuition: '👁️',
  writing: '✍️',
  rhythm: '🎵',
};

const LEVEL_UNLOCKS: Record<number, string> = {
  2: 'Навык «Базовый взлом» доступен',
  3: 'Очко черты получено! Новые черты разблокированы',
  5: 'Продвинутые навыки дерева разблокированы',
  6: 'Очко черты получено! Новые черты разблокированы',
  7: 'Доступ к торговле улучшенными предметами',
  9: 'Очко черты получено! Новые черты разблокированы',
  10: 'Мастерские навыки разблокированы',
  12: 'Очко черты получено! Новые черты разблокированы',
  15: 'Легендарные навыки разблокированы',
};

const DEFAULT_UNLOCK_MESSAGE =
  'Продолжайте развивать навыки и открывать новые черты';

export function hasLevelUpSnapshot(
  payload: Partial<LevelUpEvent>,
): payload is LevelUpEvent {
  return (
    payload.prevSkills !== undefined
    && payload.prevSkillPoints !== undefined
    && payload.prevPerkPoints !== undefined
    && payload.prevXp !== undefined
    && payload.prevKarma !== undefined
  );
}

export function computeStatChanges(
  prevSkills: PlayerSkills,
  currentSkills: PlayerSkills,
): StatChange[] {
  return (Object.entries(currentSkills) as [TrainablePlayerSkill, number][])
    .map(([skill, after]) => ({
      label: SKILL_LABELS[skill],
      icon: SKILL_ICONS[skill],
      before: prevSkills[skill],
      after,
      delta: after - prevSkills[skill],
    }))
    .filter((change) => change.delta !== 0);
}

export function getUnlockMessagesInRange(prevLevel: number, newLevel: number): string[] {
  const messages: string[] = [];
  for (let level = prevLevel + 1; level <= newLevel; level += 1) {
    const message = LEVEL_UNLOCKS[level];
    if (message) messages.push(message);
  }
  if (messages.length === 0 && newLevel > prevLevel) {
    messages.push(DEFAULT_UNLOCK_MESSAGE);
  }
  return messages;
}

export function buildSummaryAnnouncement(data: LevelUpSummaryData): string {
  const parts = [`Уровень повышен до ${data.newLevel}`];
  if (data.levelsGained > 0) {
    parts.push(formatSkillPointsLabel(data.levelsGained).replace('+', 'Получено '));
  }
  if (data.perkPointsGained > 0) {
    parts.push(formatPerkPointsLabel(data.perkPointsGained).replace('+', 'Получено '));
  }
  return `${parts.join('. ')}.`;
}

export function toLevelUpSummaryData(
  payload: Partial<LevelUpEvent> & Pick<LevelUpEvent, 'newLevel' | 'prevLevel'>,
  id: string,
): LevelUpSummaryData | null {
  if (!hasLevelUpSnapshot(payload)) {
    return null;
  }

  return {
    ...payload,
    levelsGained: payload.levelsGained ?? payload.newLevel - payload.prevLevel,
    perkPointsGained: payload.perkPointsGained ?? 0,
    perkPointGained: payload.perkPointGained ?? (payload.perkPointsGained ?? 0) > 0,
    id,
  };
}
