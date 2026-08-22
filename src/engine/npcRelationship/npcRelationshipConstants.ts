export type RelationLevel = 'ally' | 'neutral' | 'enemy';

// Pure numeric thresholds live in @/shared/constants so shared-layer modules
// (e.g. `@/shared/npcBark.ts`) can read them without importing from @/engine
// (no-restricted-imports boundary contract). Re-exported here for backward
// compatibility with engine/component callers
// (`DialogueRelationBar`, `npcRelationshipPresentation`, etc.).
export {
  NPC_RELATION_ALLY_THRESHOLD,
  NPC_RELATION_ENEMY_THRESHOLD,
} from '@/shared/constants/npcRelationThresholds';

export const NPC_RELATIONSHIP_LABELS = {
  title: 'Отношения',
  schedule: 'Расписание',
  showSchedule: 'Показать расписание',
  hideSchedule: 'Скрыть расписание',
  close: 'Закрыть',
  closeHint: 'закрыть',
  relation: 'Отношение',
  affinity: 'Расположение',
  gift: 'Подарить',
  giftAria: (name: string) => `Подарить ${name}`,
  emptyTitle: 'Нет знакомых',
  emptyBody: 'Исследуйте мир и общайтесь с персонажами, чтобы появились отношения',
  knownCount: (count: number) => `Знакомых: ${count}`,
  alliesCount: (count: number) => `${count} союзников`,
  enemiesCount: (count: number) => `${count} врагов`,
} as const;

export const RELATION_LEVEL_LABELS: Record<RelationLevel, string> = {
  ally: 'Союзник',
  neutral: 'Нейтрал',
  enemy: 'Враг',
};

export const RELATION_LEVEL_COLORS: Record<
  RelationLevel,
  { bar: string; bg: string; text: string; border: string; glow: string }
> = {
  ally: {
    bar: 'bg-emerald-500',
    bg: 'bg-emerald-950/30',
    text: 'text-emerald-400',
    border: 'border-emerald-700/40',
    glow: 'rgba(16,185,129,0.15)',
  },
  neutral: {
    bar: 'bg-amber-500',
    bg: 'bg-amber-950/30',
    text: 'text-amber-400',
    border: 'border-amber-700/40',
    glow: 'rgba(245,158,11,0.15)',
  },
  enemy: {
    bar: 'bg-red-500',
    bg: 'bg-red-950/30',
    text: 'text-red-400',
    border: 'border-red-700/40',
    glow: 'rgba(239,68,68,0.15)',
  },
};

export const DEFAULT_NPC_PORTRAIT_PRIMARY = '#94a3b8';

// `NPC_RELATION_ALLY_THRESHOLD` (65) and `NPC_RELATION_ENEMY_THRESHOLD` (30)
// are re-exported at the top of this file from `@/shared/constants/npcRelationThresholds`.
