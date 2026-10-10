/**
 * Система репутации фракций
 * Определяет типы фракций, уровни репутации и заголовки
 */

export type FactionId =
  | 'streltsy'
  | 'tolpa'
  | 'merchant_guild'
  | 'underground'
  | 'forest_folk';

export interface FactionReputation {
  factionId: FactionId;
  level: number; // -100 … +100
}

export interface FactionDefinition {
  id: FactionId;
  name: string;
  description: string;
  baseDiscount: number; // процент скидки/наценки от репутации
  questAccessThreshold: number; // минимальная репутация для спец. квестов
}

export const FACTION_DEFINITIONS: Record<FactionId, FactionDefinition> = {
  streltsy: {
    id: 'streltsy',
    name: 'Стрелецкий приказ',
    description: 'Городская стража и военный гарнизон. Хранят порядок — по крайней мере, так говорят.',
    baseDiscount: 0.5,
    questAccessThreshold: 30,
  },
  tolpa: {
    id: 'tolpa',
    name: 'Толпа',
    description: 'Неорганизованное сборище горожан, бунтарей и тех, кто не вписался в систему.',
    baseDiscount: 0.3,
    questAccessThreshold: 20,
  },
  merchant_guild: {
    id: 'merchant_guild',
    name: 'Торговая гильдия',
    description: 'Купцы и ремесленники, контролирующие поток товаров и золота в городе.',
    baseDiscount: 1.0,
    questAccessThreshold: 25,
  },
  underground: {
    id: 'underground',
    name: 'Подполье',
    description: 'Теневая сеть контрабандистов, информаторов и тех, кто живёт вне закона.',
    baseDiscount: 0.8,
    questAccessThreshold: 40,
  },
  forest_folk: {
    id: 'forest_folk',
    name: 'Лесной народ',
    description: 'Жители лесных окраин — охотники, травники, хранители древних традиций.',
    baseDiscount: 0.6,
    questAccessThreshold: 15,
  },
};

/** Пороги репутации и соответствующие русские заголовки */
export const REPUTATION_THRESHOLDS = [
  { min: 80, title: 'Почитаемый союзник', color: '#e2a84b' },
  { min: 50, title: 'Доверенный друг', color: '#46b96e' },
  { min: 20, title: 'Сочувствующий', color: '#57a874' },
  { min: -20, title: 'Нейтрал', color: '#a1a1aa' },
  { min: -50, title: 'Недоверчивый', color: '#e2a84b' },
  { min: -80, title: 'Враг', color: '#c65548' },
  { min: -101, title: 'Ненависть', color: '#991b1b' },
] as const;

export function getFactionTitle(level: number): string {
  for (const t of REPUTATION_THRESHOLDS) {
    if (level >= t.min) return t.title;
  }
  return 'Ненависть';
}

export function getFactionColor(level: number): string {
  for (const t of REPUTATION_THRESHOLDS) {
    if (level >= t.min) return t.color;
  }
  return '#991b1b';
}
