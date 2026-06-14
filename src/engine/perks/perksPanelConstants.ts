import type { PerkCategory } from '@/data/perks';

export const PERKS_PANEL_LABELS = {
  title: 'ЧЕРТЫ',
  urlPath: 'volodka://perks',
  shortcut: 'V',
  perkPointsUnit: 'очков черт',
  tabAll: 'Все',
  tabAllAria: 'Показать все категории черт',
  tabCategoryAria: (name: string, acquired: number, total: number) =>
    `${name}, получено ${acquired} из ${total}`,
  listAria: 'Список черт',
  emptyCategory: 'Нет доступных черт в этой категории',
  footerUrl: 'volodka://perks',
  footerProgress: (acquired: number, total: number) =>
    `Получено: ${acquired}/${total} • Очки черт даются каждые 3 уровня`,
  acquire: 'Выбрать черту',
  acquireAria: (name: string) => `Выбрать черту: ${name}`,
  noPoints: 'Нет очков черт',
  activeBadge: 'АКТИВ',
  exclusiveNotice: 'Несовместимо с выбранной чертой',
  levelRequirement: (level: number) => `Ур.${level}`,
  categoryChanged: (name: string) => `Категория: ${name}`,
  stateAcquired: 'Черта получена',
  stateLocked: 'Заблокировано',
  stateExclusive: 'Несовместимо с другой чертой',
  stateAvailable: 'Доступно для выбора',
} as const;

export const PERK_CATEGORY_TAB_LABELS: Record<PerkCategory, string> = {
  survival: 'Выживание',
  social: 'Социальные',
  combat: 'Боевые',
  poetic: 'Поэтические',
  technical: 'Технические',
};

export const PERK_CATEGORIES: PerkCategory[] = [
  'survival',
  'social',
  'combat',
  'poetic',
  'technical',
];

export const DEFAULT_PERK_COST = 1;
