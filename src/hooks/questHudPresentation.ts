import type { QuestType } from '@/shared/types/game';

export type QuestGuidanceUrgency = 'required' | 'recommended' | 'optional';

export type QuestObjectiveKind = 'active_quest' | 'available_quest' | 'story_guidance';

export function getQuestUrgencyColor(urgency: QuestGuidanceUrgency): string {
  switch (urgency) {
    case 'required':
      return '#00ffee';
    case 'recommended':
      return '#66ffaa';
    case 'optional':
      return '#888888';
    default: {
      const _exhaustive: never = urgency;
      return _exhaustive;
    }
  }
}

export function formatQuestObjectiveProgress(completed: number, total: number): string {
  if (total <= 0) return '';
  return `${completed}/${total} целей`;
}

export function computeObjectiveProgressPercent(completed: number, total: number): number {
  if (total <= 0) return 0;
  return Math.round((completed / total) * 100);
}

export function getQuestTypeStripLabel(
  questType: QuestType,
  kind: QuestObjectiveKind,
): string {
  if (kind === 'available_quest') return 'ДОСТУПНО';
  switch (questType) {
    case 'main':
      return 'ОСНОВНОЕ';
    case 'side':
      return 'ПОБОЧНОЕ';
    case 'hidden':
      return 'СКРЫТОЕ';
    case 'daily':
      return 'ЕЖЕДНЕВНОЕ';
    default: {
      const _exhaustive: never = questType;
      return _exhaustive;
    }
  }
}

export function resolveQuestUrgency(
  questType: QuestType,
  kind: QuestObjectiveKind,
  storyUrgency?: QuestGuidanceUrgency,
): QuestGuidanceUrgency {
  if (kind === 'available_quest') return 'recommended';
  if (kind === 'active_quest') {
    return questType === 'main' ? 'required' : 'recommended';
  }
  return storyUrgency ?? 'recommended';
}

/** Prefer pulsing badge for fresh events; otherwise show active quest count. */
export function resolveHudQuestBadgeCount(
  recentNewCount: number,
  activeQuestCount: number,
): number {
  if (recentNewCount > 0) return Math.min(recentNewCount, 9);
  if (activeQuestCount > 0) return Math.min(activeQuestCount, 9);
  return 0;
}

export function shouldPulseQuestBadge(recentNewCount: number): boolean {
  return recentNewCount > 0;
}
